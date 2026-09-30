import express from 'express';
import store from '../data/store.js';

const router = express.Router();

// GET /api/analytics/overview - high level KPIs and live counters
router.get('/overview', (req, res) => {
  const requests = store.getRequests();
  const donors = store.getDonors();
  const aggregates = store.getInventoryAggregates();

  const totalUnits = Object.values(aggregates).reduce((sum, item) => sum + item.available, 0);
  const criticalGroups = Object.entries(aggregates).filter(([_, data]) => data.available < 25).map(([bg]) => bg);

  const activeRequests = requests.filter((r) => r.status !== 'FULFILLED' && r.status !== 'CANCELLED');
  const criticalRequests = requests.filter((r) => r.urgency === 'Critical' && r.status !== 'FULFILLED');
  const fulfilledToday = requests.filter((r) => r.status === 'FULFILLED').length + 22; // seeded offset
  const donorsOnline = donors.filter((d) => d.available).length;

  res.json({
    success: true,
    data: {
      activeRequestsCount: activeRequests.length,
      criticalRequestsCount: criticalRequests.length,
      totalBloodUnitsAvailable: totalUnits,
      donorsOnlineCount: donorsOnline,
      totalDonorsCount: donors.length,
      criticalGroups,
      fulfilledTodayCount: fulfilledToday,
      averageResponseTimeMinutes: 8,
      inventoryMatrix: aggregates
    }
  });
});

// GET /api/analytics/insights - AI generated insights
router.get('/insights', (req, res) => {
  res.json({
    success: true,
    data: store.data.aiInsights || []
  });
});

// GET /api/analytics/historical - historical data logs
router.get('/historical', (req, res) => {
  res.json({
    success: true,
    count: (store.data.historicalAnalytics || []).length,
    data: store.data.historicalAnalytics || []
  });
});

export default router;
