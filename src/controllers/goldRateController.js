const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { GoldRateHistory } = require('../models');
const { refreshGoldRate } = require('../jobs/goldRateCron');

const STALE_AFTER_MINUTES = 30;

// ---- GET /api/gold-rate/latest ---- (public — the homepage needs this without forcing login)
const getLatest = asyncHandler(async (req, res) => {
  const latest = await GoldRateHistory.findOne({ order: [['fetchedAt', 'DESC']] });
  if (!latest) {
    throw new ApiError(503, 'No gold rate has been fetched yet. Try again shortly.');
  }
  const ageMinutes = (Date.now() - new Date(latest.fetchedAt).getTime()) / 60000;
  const isCurrentlyLive = latest.isLive && ageMinutes <= STALE_AFTER_MINUTES;

  res.json({
    success: true,
    data: {
      rate24k: parseFloat(latest.rate24k),
      rate22k: parseFloat(latest.rate22k),
      rate18k: parseFloat(latest.rate18k),
      currency: latest.currency,
      source: latest.source,
      fetchedAt: latest.fetchedAt,
      isLive: isCurrentlyLive,
      staleNotice: isCurrentlyLive ? null : 'This is the last verified price. The live feed is not currently reachable.',
    },
  });
});

// ---- GET /api/gold-rate/history ---- (protected, per spec)
const getHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const rows = await GoldRateHistory.findAll({ order: [['fetchedAt', 'DESC']], limit });
  res.json({ success: true, data: rows });
});

// ---- POST /api/gold-rate/refresh ---- (admin only — manual trigger)
const forceRefresh = asyncHandler(async (req, res) => {
  const result = await refreshGoldRate();
  res.json({ success: true, data: result });
});

module.exports = { getLatest, getHistory, forceRefresh };
