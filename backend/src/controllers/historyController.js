const historyService = require("../services/historyService");

/**
 * GET /api/history
 * Query parameters:
 *   - limit: number of records to return (default 10)
 *   - brand: filter by car manufacturer (e.g., "TOYOTA")
 *   - min_price: minimum price in Lakhs
 *   - max_price: maximum price in Lakhs
 */
const getHistory = (req, res) => {
  const { limit, brand, min_price, max_price } = req.query;

  const records = historyService.getRecords({
    limit,
    brand,
    minPrice: min_price,
    maxPrice: max_price,
  });

  return res.status(200).json({
    status: "success",
    count: records.length,
    filters_applied: {
      limit: limit || 10,
      brand: brand || null,
      min_price: min_price || null,
      max_price: max_price || null,
    },
    history: records,
  });
};

/**
 * GET /api/history/stats
 */
const getHistoryStats = (req, res) => {
  const stats = historyService.getStats();
  return res.status(200).json({
    status: "success",
    stats,
  });
};

/**
 * GET /api/history/:id
 */
const getHistoryById = (req, res) => {
  const { id } = req.params;
  const record = historyService.getById(id);

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
};

/**
 * DELETE /api/history
 * Clears in-memory prediction history.
 */
const clearHistory = (req, res) => {
  const result = historyService.clear();
  return res.status(200).json({
    status: "success",
    message: "Prediction history successfully cleared.",
    ...result,
  });
};

module.exports = {
  getHistory,
  getHistoryStats,
  getHistoryById,
  clearHistory,
};
