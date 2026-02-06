const express = require('express');
const { payoutService } = require('./payoutService');

function registerPayoutRoutes(app, adminAuthService) {
  const adminAuth = adminAuthService.requireAuth('operator');

  app.get('/api/payouts/me', async (req, res) => {
    try {
      const { guide_id, month } = req.query;
      if (!guide_id) return res.status(400).json({ error: 'guide_id is required' });
      const m = month || _currentMonth();
      const summary = await payoutService.getGuidePayoutSummary(guide_id, m);
      res.json(summary);
    } catch (err) {
      console.error('GET /api/payouts/me error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/activity/me', async (req, res) => {
    try {
      const { guide_id, month } = req.query;
      if (!guide_id) return res.status(400).json({ error: 'guide_id is required' });
      const m = month || _currentMonth();
      const contributions = await payoutService.getContributions({ guide_id, month: m });
      const scores = await payoutService.getGuideScores({ guide_id, month: m });
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

  app.post('/api/admin/run-monthly', adminAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'month format: YYYY-MM' });
      }
      const result = await payoutService.runMonthlyCalculation(month);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/unlock-month', adminAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month) return res.status(400).json({ error: 'month required' });
      await payoutService.unlockMonth(month);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/payout-guides-list', adminAuth, async (req, res) => {
    try {
      const { rows } = await payoutService.query(
        "SELECT id, guide_name FROM tourism_guides WHERE status='active' OR is_available=true ORDER BY guide_name"
      );
      res.json(rows);
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
