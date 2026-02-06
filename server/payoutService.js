const { Pool } = require('pg');

class PayoutService {
  constructor() {
    this.pool = null;
    this.initPool();
  }

  initPool() {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not set for PayoutService');
      return;
    }
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    this.pool.on('error', (err) => {
      console.error('❌ PayoutService pool error:', err.message);
    });
    console.log('✅ PayoutService DB pool initialized');
  }

  async query(text, params) {
    if (!this.pool) throw new Error('DB not available');
    return this.pool.query(text, params);
  }

  async getSettings() {
    const { rows } = await this.query('SELECT key, value_json FROM payout_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value_json; });
    return settings;
  }

  async getSetting(key) {
    const { rows } = await this.query('SELECT value_json FROM payout_settings WHERE key = $1', [key]);
    return rows[0]?.value_json || null;
  }

  async updateSetting(key, valueJson) {
    await this.query(
      'INSERT INTO payout_settings (key, value_json, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value_json = $2, updated_at = NOW()',
      [key, JSON.stringify(valueJson)]
    );
  }

  async getFounders() {
    const { rows } = await this.query(`
      SELECT sf.*, tg.guide_name, ss.store_name
      FROM store_founders sf
      LEFT JOIN tourism_guides tg ON sf.guide_id = tg.id
      LEFT JOIN sponsor_stores ss ON sf.store_id = ss.id
      ORDER BY sf.assigned_at DESC
    `);
    return rows;
  }

  async getFounderByStore(storeId) {
    const { rows } = await this.query('SELECT * FROM store_founders WHERE store_id = $1', [storeId]);
    return rows[0] || null;
  }

  async getFounderCountByGuide(guideId) {
    const { rows } = await this.query('SELECT COUNT(*) as cnt FROM store_founders WHERE guide_id = $1', [guideId]);
    return parseInt(rows[0].cnt, 10);
  }

  async assignFounder(storeId, guideId) {
    const maxStores = await this.getSetting('founder_max_stores');
    const max = maxStores?.max || 200;
    const currentCount = await this.getFounderCountByGuide(guideId);
    if (currentCount >= max) {
      throw new Error(`ガイドの紐付け上限（${max}店舗）に達しています`);
    }
    await this.query(
      'INSERT INTO store_founders (store_id, guide_id) VALUES ($1, $2) ON CONFLICT (store_id) DO UPDATE SET guide_id = $2, assigned_at = NOW()',
      [storeId, guideId]
    );
  }

  async removeFounder(storeId) {
    await this.query('DELETE FROM store_founders WHERE store_id = $1', [storeId]);
  }

  async getContributions(filters = {}) {
    let sql = `
      SELECT c.*, tg.guide_name, ss.store_name
      FROM contributions c
      LEFT JOIN tourism_guides tg ON c.guide_id = tg.id
      LEFT JOIN sponsor_stores ss ON c.store_id = ss.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    if (filters.month) { sql += ` AND c.month = $${idx++}`; params.push(filters.month); }
    if (filters.guide_id) { sql += ` AND c.guide_id = $${idx++}`; params.push(filters.guide_id); }
    if (filters.store_id) { sql += ` AND c.store_id = $${idx++}`; params.push(filters.store_id); }
    sql += ' ORDER BY c.created_at DESC';
    const { rows } = await this.query(sql, params);
    return rows;
  }

  async addContribution(data) {
    const pointDefs = await this.getSetting('point_definitions');
    const basePoints = pointDefs?.[data.type]?.base_points || 0;

    if (data.type === 'B') {
      const limits = await this.getSetting('contribution_limits');
      const maxB = limits?.B_monthly_per_store || 1;
      const { rows } = await this.query(
        "SELECT COUNT(*) as cnt FROM contributions WHERE guide_id=$1 AND store_id=$2 AND month=$3 AND type='B'",
        [data.guide_id, data.store_id, data.month]
      );
      if (parseInt(rows[0].cnt, 10) >= maxB) {
        throw new Error(`利用・体験は月${maxB}回/店舗までです`);
      }
    }

    const { rows } = await this.query(
      'INSERT INTO contributions (store_id, guide_id, month, type, base_points, evidence_url, memo) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [data.store_id, data.guide_id, data.month, data.type, basePoints, data.evidence_url || null, data.memo || null]
    );
    return rows[0];
  }

  async deleteContribution(id) {
    await this.query('DELETE FROM contributions WHERE id = $1', [id]);
  }

  async getGuideScores(filters = {}) {
    let sql = 'SELECT * FROM monthly_guide_scores WHERE 1=1';
    const params = [];
    let idx = 1;
    if (filters.month) { sql += ` AND month = $${idx++}`; params.push(filters.month); }
    if (filters.guide_id) { sql += ` AND guide_id = $${idx++}`; params.push(filters.guide_id); }
    sql += ' ORDER BY rank_score DESC';
    const { rows } = await this.query(sql, params);
    return rows;
  }

  async getPayouts(filters = {}) {
    let sql = `
      SELECT p.*, tg.guide_name, ss.store_name
      FROM payouts p
      LEFT JOIN tourism_guides tg ON p.guide_id = tg.id
      LEFT JOIN sponsor_stores ss ON p.store_id = ss.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    if (filters.month) { sql += ` AND p.month = $${idx++}`; params.push(filters.month); }
    if (filters.guide_id) { sql += ` AND p.guide_id = $${idx++}`; params.push(filters.guide_id); }
    if (filters.type) { sql += ` AND p.type = $${idx++}`; params.push(filters.type); }
    sql += ' ORDER BY p.amount DESC';
    const { rows } = await this.query(sql, params);
    return rows;
  }

  async getGuidePayoutSummary(guideId, month) {
    const payouts = await this.getPayouts({ guide_id: guideId, month });
    const scores = await this.getGuideScores({ guide_id: guideId, month });
    const contributions = await this.getContributions({ guide_id: guideId, month });
    const founders = await this.query('SELECT sf.*, ss.store_name FROM store_founders sf LEFT JOIN sponsor_stores ss ON sf.store_id = ss.id WHERE sf.guide_id = $1', [guideId]);

    let perpetualTotal = 0, contribTotal = 0;
    payouts.forEach(p => {
      if (p.type === 'PERPETUAL') perpetualTotal += p.amount;
      else contribTotal += p.amount;
    });

    const prev3 = [];
    for (let i = 1; i <= 3; i++) {
      const pm = this._subtractMonths(month, i);
      const pp = await this.getPayouts({ guide_id: guideId, month: pm });
      let pt = 0, ct = 0;
      pp.forEach(p => { if (p.type === 'PERPETUAL') pt += p.amount; else ct += p.amount; });
      prev3.push({ month: pm, perpetual: pt, contribution: ct, total: pt + ct });
    }

    return {
      month,
      score: scores[0] || null,
      perpetual: { total: perpetualTotal, stores: founders.rows },
      contribution: { total: contribTotal, details: payouts.filter(p => p.type === 'CONTRIB') },
      contributions,
      history: prev3,
      grandTotal: perpetualTotal + contribTotal,
    };
  }

  async runMonthlyCalculation(month) {
    const { rows: locked } = await this.query(
      'SELECT COUNT(*) as cnt FROM monthly_guide_scores WHERE month=$1 AND locked=true', [month]
    );
    if (parseInt(locked[0].cnt, 10) > 0) {
      throw new Error(`${month}は既にロック済みです。管理者が解除してから再実行してください。`);
    }

    await this.query('DELETE FROM payouts WHERE month=$1', [month]);
    await this.query('DELETE FROM monthly_guide_scores WHERE month=$1', [month]);

    const settings = await this.getSettings();
    const rankMultipliers = settings.rank_multipliers || { S: 1.30, A: 1.15, B: 1.00, C: 0.85 };
    const rankThresholds = settings.rank_thresholds || { S: 80, A: 50, B: 20, C: 0 };
    const weights = settings.rank_weights || { monthly_weight: 0.6, avg3_weight: 0.4 };
    const payoutAmounts = settings.payout_amounts || { perpetual_per_store: 1000, contribution_per_store: 4000 };

    const { rows: allContribs } = await this.query(
      'SELECT guide_id, SUM(base_points) as total_points FROM contributions WHERE month=$1 GROUP BY guide_id',
      [month]
    );

    const guideMonthlyScores = {};
    allContribs.forEach(c => {
      guideMonthlyScores[c.guide_id] = parseFloat(c.total_points);
    });

    const guideIds = Object.keys(guideMonthlyScores);
    if (guideIds.length === 0) {
      const { rows: founderGuides } = await this.query('SELECT DISTINCT guide_id FROM store_founders');
      founderGuides.forEach(f => { guideIds.push(f.guide_id); guideMonthlyScores[f.guide_id] = 0; });
    } else {
      const { rows: founderGuides } = await this.query('SELECT DISTINCT guide_id FROM store_founders');
      founderGuides.forEach(f => {
        if (!guideMonthlyScores[f.guide_id]) {
          guideIds.push(f.guide_id);
          guideMonthlyScores[f.guide_id] = 0;
        }
      });
    }

    const uniqueGuideIds = [...new Set(guideIds)];

    for (const guideId of uniqueGuideIds) {
      const monthlyScore = guideMonthlyScores[guideId] || 0;

      const prev1 = this._subtractMonths(month, 1);
      const prev2 = this._subtractMonths(month, 2);
      const { rows: prevScores } = await this.query(
        'SELECT month, monthly_score FROM monthly_guide_scores WHERE guide_id=$1 AND month IN ($2,$3) ORDER BY month',
        [guideId, prev1, prev2]
      );

      const monthsActive = prevScores.length + 1;
      let avg3Score = 0;
      let rankScore = 0;

      if (monthsActive <= 1) {
        rankScore = monthlyScore;
        avg3Score = monthlyScore;
      } else if (monthsActive === 2) {
        const prevMonthly = parseFloat(prevScores[0]?.monthly_score || 0);
        avg3Score = prevMonthly;
        rankScore = 0.7 * monthlyScore + 0.3 * prevMonthly;
      } else {
        const prevValues = prevScores.map(s => parseFloat(s.monthly_score));
        avg3Score = prevValues.reduce((a, b) => a + b, 0) / prevValues.length;
        rankScore = weights.monthly_weight * monthlyScore + weights.avg3_weight * avg3Score;
      }

      let rank = 'C';
      if (rankScore >= rankThresholds.S) rank = 'S';
      else if (rankScore >= rankThresholds.A) rank = 'A';
      else if (rankScore >= rankThresholds.B) rank = 'B';

      if (monthsActive > 1) {
        const { rows: prevRankRows } = await this.query(
          'SELECT rank FROM monthly_guide_scores WHERE guide_id=$1 AND month=$2',
          [guideId, prev1]
        );
        if (prevRankRows.length > 0) {
          const prevRank = prevRankRows[0].rank;
          const rankOrder = ['C', 'B', 'A', 'S'];
          const prevIdx = rankOrder.indexOf(prevRank);
          const newIdx = rankOrder.indexOf(rank);
          if (newIdx < prevIdx - 1) {
            rank = rankOrder[prevIdx - 1];
          }
        }
      }

      await this.query(
        'INSERT INTO monthly_guide_scores (guide_id, month, monthly_score, avg3_score, rank_score, rank) VALUES ($1,$2,$3,$4,$5,$6)',
        [guideId, month, monthlyScore, avg3Score, rankScore, rank]
      );
    }

    const { rows: founders } = await this.query(`
      SELECT sf.store_id, sf.guide_id
      FROM store_founders sf
      JOIN sponsor_stores ss ON sf.store_id = ss.id
      WHERE ss.status = 'active' OR ss.is_active = true
    `);

    for (const founder of founders) {
      await this.query(
        'INSERT INTO payouts (guide_id, store_id, month, type, amount, details_json) VALUES ($1,$2,$3,$4,$5,$6)',
        [founder.guide_id, founder.store_id, month, 'PERPETUAL', payoutAmounts.perpetual_per_store,
         JSON.stringify({ reason: '永続配当', store_id: founder.store_id })]
      );
    }

    const { rows: storeContribs } = await this.query(`
      SELECT c.store_id, c.guide_id, SUM(c.base_points) as total_points
      FROM contributions c
      JOIN sponsor_stores ss ON c.store_id = ss.id
      WHERE c.month = $1 AND (ss.status = 'active' OR ss.is_active = true)
      GROUP BY c.store_id, c.guide_id
    `, [month]);

    const storeGroups = {};
    storeContribs.forEach(sc => {
      if (!storeGroups[sc.store_id]) storeGroups[sc.store_id] = [];
      storeGroups[sc.store_id].push(sc);
    });

    const scoreMap = {};
    const { rows: allScores } = await this.query(
      'SELECT guide_id, rank FROM monthly_guide_scores WHERE month=$1', [month]
    );
    allScores.forEach(s => { scoreMap[s.guide_id] = s.rank; });

    for (const [storeId, guideContribs] of Object.entries(storeGroups)) {
      let totalAdjPoints = 0;
      const adjList = guideContribs.map(gc => {
        const rank = scoreMap[gc.guide_id] || 'C';
        const multiplier = rankMultipliers[rank] || 1.0;
        const adjPoints = parseFloat(gc.total_points) * multiplier;
        totalAdjPoints += adjPoints;
        return { guide_id: gc.guide_id, raw_points: parseFloat(gc.total_points), rank, multiplier, adj_points: adjPoints };
      });

      if (totalAdjPoints === 0) continue;

      for (const item of adjList) {
        const amount = Math.round(payoutAmounts.contribution_per_store * item.adj_points / totalAdjPoints);
        if (amount <= 0) continue;
        await this.query(
          'INSERT INTO payouts (guide_id, store_id, month, type, amount, details_json) VALUES ($1,$2,$3,$4,$5,$6)',
          [item.guide_id, storeId, month, 'CONTRIB', amount,
           JSON.stringify({ raw_points: item.raw_points, rank: item.rank, multiplier: item.multiplier, adj_points: item.adj_points, total_adj_in_store: totalAdjPoints })]
        );
      }
    }

    await this.query('UPDATE monthly_guide_scores SET locked=true WHERE month=$1', [month]);

    const { rows: summary } = await this.query(`
      SELECT
        (SELECT COUNT(*) FROM monthly_guide_scores WHERE month=$1) as guides_scored,
        (SELECT COALESCE(SUM(amount),0) FROM payouts WHERE month=$1 AND type='PERPETUAL') as perpetual_total,
        (SELECT COALESCE(SUM(amount),0) FROM payouts WHERE month=$1 AND type='CONTRIB') as contrib_total
    `, [month]);

    return {
      month,
      guides_scored: parseInt(summary[0].guides_scored, 10),
      perpetual_total: parseInt(summary[0].perpetual_total, 10),
      contrib_total: parseInt(summary[0].contrib_total, 10),
      grand_total: parseInt(summary[0].perpetual_total, 10) + parseInt(summary[0].contrib_total, 10),
    };
  }

  async unlockMonth(month) {
    await this.query('UPDATE monthly_guide_scores SET locked=false WHERE month=$1', [month]);
    await this.query('UPDATE payouts SET locked=false WHERE month=$1', [month]);
  }

  _subtractMonths(monthStr, n) {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1 - n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}

const payoutService = new PayoutService();
module.exports = { payoutService };
