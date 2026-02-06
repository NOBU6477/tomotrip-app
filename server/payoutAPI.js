const express = require('express');
const { payoutService } = require('./payoutService');

function registerPayoutRoutes(app, adminAuthService) {
  const adminAuth = adminAuthService.requireAuth('operator');

  async function resolveGuide(req, res) {
    const k = req.query.k;
    if (k) {
      const guide = await payoutService.resolveGuideByKey(k);
      if (!guide) { res.status(404).json({ error: 'INVALID_KEY' }); return null; }
      return guide;
    }
    res.status(400).json({ error: 'k is required' });
    return null;
  }

  app.get('/api/payouts/resolve', async (req, res) => {
    try {
      const { k } = req.query;
      if (!k) return res.status(400).json({ error: 'k is required' });
      const guide = await payoutService.resolveGuideByKey(k);
      if (!guide) return res.status(404).json({ error: 'INVALID_KEY' });
      res.json({
        guide_id: guide.id,
        guide_name: guide.guide_name,
        preferred_language: guide.preferred_language || 'ja',
        contact_method: guide.contact_method || 'line'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/payouts/me', async (req, res) => {
    try {
      const guide = await resolveGuide(req, res);
      if (!guide) return;
      const m = req.query.month || _currentMonth();
      const summary = await payoutService.getGuidePayoutSummary(guide.id, m);
      res.json(summary);
    } catch (err) {
      console.error('GET /api/payouts/me error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/activity/me', async (req, res) => {
    try {
      const guide = await resolveGuide(req, res);
      if (!guide) return;
      const m = req.query.month || _currentMonth();
      const contributions = await payoutService.getContributions({ guide_id: guide.id, month: m });
      const scores = await payoutService.getGuideScores({ guide_id: guide.id, month: m });
      res.json({ month: m, contributions, score: scores[0] || null });
    } catch (err) {
      console.error('GET /api/activity/me error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/payout-settings', adminAuth, async (req, res) => {
    try {
      const settings = await payoutService.getSettings();
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/payout-settings/:key', adminAuth, async (req, res) => {
    try {
      await payoutService.updateSetting(req.params.key, req.body.value);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/payout-founders', adminAuth, async (req, res) => {
    try {
      const founders = await payoutService.getFounders();
      res.json(founders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/payout-founders', adminAuth, async (req, res) => {
    try {
      const { store_id, guide_id } = req.body;
      if (!store_id || !guide_id) return res.status(400).json({ error: 'store_id and guide_id required' });
      await payoutService.assignFounder(store_id, guide_id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/admin/payout-founders/:storeId', adminAuth, async (req, res) => {
    try {
      await payoutService.removeFounder(req.params.storeId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/payout-contributions', adminAuth, async (req, res) => {
    try {
      const { month, guide_id, store_id } = req.query;
      const contributions = await payoutService.getContributions({ month, guide_id, store_id });
      res.json(contributions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/payout-contributions', adminAuth, async (req, res) => {
    try {
      const result = await payoutService.addContribution(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/admin/payout-contributions/:id', adminAuth, async (req, res) => {
    try {
      await payoutService.deleteContribution(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/payout-scores', adminAuth, async (req, res) => {
    try {
      const { month } = req.query;
      const scores = await payoutService.getGuideScores({ month });
      res.json(scores);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/payout-results', adminAuth, async (req, res) => {
    try {
      const { month, guide_id } = req.query;
      const payouts = await payoutService.getPayouts({ month, guide_id });
      res.json(payouts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/month-status', adminAuth, async (req, res) => {
    try {
      const { month } = req.query;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'month format: YYYY-MM' });
      }
      const status = await payoutService.getMonthStatus(month);
      const logs = await payoutService.getAuditLogs(month);
      res.json({ ...status, auditLogs: logs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/run-monthly', adminAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'month format: YYYY-MM' });
      }
      const ms = await payoutService.getMonthStatus(month);
      if (ms.status === 'locked') {
        return res.status(409).json({ error: '確定済みの月は再計算できません。先に確定解除してください。' });
      }
      const result = await payoutService.runMonthlyCalculation(month);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/lock-month', adminAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'month format: YYYY-MM' });
      }
      const adminUser = req.adminUser?.username || 'unknown';
      const role = req.adminUser?.level || 'unknown';
      await payoutService.lockMonth(month, adminUser, role);
      res.json({ success: true, message: month + ' を確定しました' });
    } catch (err) {
      if (err.message.includes('既に確定済み')) return res.status(409).json({ error: err.message });
      res.status(400).json({ error: err.message });
    }
  });

  const adminOnlyAuth = adminAuthService.requireAuth('admin');

  app.post('/api/admin/unlock-month', adminOnlyAuth, async (req, res) => {
    try {
      const { month, reason } = req.body;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'month format: YYYY-MM' });
      }
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: '解除理由は必須です' });
      }
      const adminUser = req.adminUser?.username || 'unknown';
      const role = req.adminUser?.level || 'unknown';
      await payoutService.unlockMonth(month, adminUser, role, reason.trim());
      res.json({ success: true, message: month + ' の確定を解除しました' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/audit-logs', adminAuth, async (req, res) => {
    try {
      const { month } = req.query;
      const logs = await payoutService.getAuditLogs(month);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/payout-guides-list', adminAuth, async (req, res) => {
    try {
      const { rows } = await payoutService.query(
        "SELECT id, guide_name, preferred_language, contact_method, email, dashboard_key FROM tourism_guides WHERE status='active' OR is_available=true ORDER BY guide_name"
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/guide-profile/:guideId', adminAuth, async (req, res) => {
    try {
      const profile = await payoutService.getGuideProfileForAdmin(req.params.guideId);
      if (!profile) return res.status(404).json({ error: 'Guide not found' });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/guide-profile/:guideId', adminAuth, async (req, res) => {
    try {
      await payoutService.updateGuideProfile(req.params.guideId, req.body);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/guide-dashboard-key/:guideId', adminAuth, async (req, res) => {
    try {
      const newKey = await payoutService.regenerateDashboardKey(req.params.guideId);
      res.json({ success: true, dashboard_key: newKey });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/payout-stores-list', adminAuth, async (req, res) => {
    try {
      const { rows } = await payoutService.query(
        "SELECT id, store_name FROM sponsor_stores WHERE status='active' OR is_active=true ORDER BY store_name"
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log('✅ Payout API routes registered');
}

function _currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = { registerPayoutRoutes };
