const historyService = require("../services/historyService");

/**
 * GET /api/history
 * Query parameters:
 *   - limit: number of records to return (default 10)
 *   - brand: filter by car manufacturer (e.g., "TOYOTA")
 *   - min_price: minimum price in Lakhs
 *   - max_price: maximum price in Lakhs
 */
const getHistory = async (req, res, next) => {
  try {
    const { limit, brand, min_price, max_price } = req.query;

    const records = await historyService.getRecords({
      limit,
      brand,
      minPrice: min_price,
      maxPrice: max_price,
    });

    return res.status(200).json({
      status: "success",
      source: historyService.isRedisActive() ? "redis_cloud" : "in_memory",
      count: records.length,
      filters_applied: {
        limit: limit || 10,
        brand: brand || null,
        min_price: min_price || null,
        max_price: max_price || null,
      },
      history: records,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/history/stats
 */
const getHistoryStats = async (req, res, next) => {
  try {
    const stats = await historyService.getStats();
    return res.status(200).json({
      status: "success",
      stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/history/:id
 */
const getHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await historyService.getById(id);

    if (!record) {
      return res.status(404).json({
        status: "fail",
        message: `Prediction record with ID '${id}' not found.`,
      });
    }

    return res.status(200).json({
      status: "success",
      prediction: record,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/history
 * Clears prediction history from Redis & memory.
 */
const clearHistory = async (req, res, next) => {
  try {
    const result = await historyService.clear();
    return res.status(200).json({
      status: "success",
      message: "Prediction history successfully cleared.",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHistory,
  getHistoryStats,
  getHistoryById,
  clearHistory,
};
