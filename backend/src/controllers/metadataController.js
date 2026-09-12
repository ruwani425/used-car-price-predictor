const mlClient = require("../services/mlClient");

// Cache metadata in memory to reduce overhead
let cachedMetadata = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Handles GET /api/metadata
 * Returns available brands, brand-model mapping, towns, fuel types, and summary statistics.
 */
const handleGetMetadata = async (req, res, next) => {
  try {
    const now = Date.now();
    if (cachedMetadata && now - lastFetchedTime < CACHE_TTL_MS) {
      return res.status(200).json({
        ...cachedMetadata,
        cached: true,
      });
    }

    const data = await mlClient.getMetadata();
    cachedMetadata = data;
    lastFetchedTime = now;

    return res.status(200).json({
      ...data,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGetMetadata,
};
