const mlClient = require("../services/mlClient");

/**
 * Handles GET /api/analytics and /api/metrics
 * Proxies model evaluation leaderboard, feature importances, and sample statistics.
 */
const handleGetAnalytics = async (req, res, next) => {
  try {
    const data = await mlClient.getMetrics();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGetAnalytics,
};
