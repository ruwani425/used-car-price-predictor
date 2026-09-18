const { redisClient, isRedisAvailable } = require("../config/redis");

const REDIS_HISTORY_KEY = "prediction:history";
const MAX_HISTORY_SIZE = 100;

class HistoryService {
  constructor(maxSize = MAX_HISTORY_SIZE) {
    this.maxSize = maxSize;
    this.records = []; // In-memory fallback
  }

  isRedisActive() {
    return isRedisAvailable() && redisClient !== null;
  }

  /**
   * Adds a new prediction record to Redis and local memory.
   */
  async addRecord(record) {
    const historyItem = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...record,
    };

    // Update in-memory fallback
    this.records.unshift(historyItem);
    if (this.records.length > this.maxSize) {
      this.records.pop();
    }

    // Persist to Upstash Cloud Redis
    if (this.isRedisActive()) {
      try {
        await redisClient.lpush(REDIS_HISTORY_KEY, JSON.stringify(historyItem));
        await redisClient.ltrim(REDIS_HISTORY_KEY, 0, this.maxSize - 1);
      } catch (err) {
        console.warn("[HistoryService] Redis write failed, kept in-memory:", err.message);
      }
    }

    return historyItem;
  }

  /**
   * Retrieves history records with optional filters.
   */
  async getRecords({ limit = 10, brand = null, minPrice = null, maxPrice = null } = {}) {
    let allRecords = this.records;

    // Fetch from Redis if available
    if (this.isRedisActive()) {
      try {
        const rawItems = await redisClient.lrange(REDIS_HISTORY_KEY, 0, this.maxSize - 1);
        if (rawItems && rawItems.length > 0) {
          allRecords = rawItems.map((item) => JSON.parse(item));
          this.records = allRecords; // Sync in-memory cache
        }
      } catch (err) {
        console.warn("[HistoryService] Redis read failed, using in-memory:", err.message);
        allRecords = this.records;
      }
    }

    let filtered = allRecords;

    if (brand && typeof brand === "string" && brand.trim()) {
      const brandClean = brand.trim().toUpperCase();
      filtered = filtered.filter(
        (r) =>
          r.requested_vehicle?.brand?.toUpperCase() === brandClean ||
          r.vehicle_summary?.brand?.toUpperCase() === brandClean
      );
    }

    if (minPrice !== null && !isNaN(Number(minPrice))) {
      const min = Number(minPrice);
      filtered = filtered.filter(
        (r) => (r.predicted_price_lkr_lakhs || 0) >= min
      );
    }

    if (maxPrice !== null && !isNaN(Number(maxPrice))) {
      const max = Number(maxPrice);
      filtered = filtered.filter(
        (r) => (r.predicted_price_lkr_lakhs || 0) <= max
      );
    }

    const effectiveLimit = Math.max(1, parseInt(limit, 10) || 10);
    return filtered.slice(0, effectiveLimit);
  }

  /**
   * Retrieves single record by ID.
   */
  async getById(id) {
    const records = await this.getRecords({ limit: this.maxSize });
    return records.find((r) => r.id === id) || null;
  }

  /**
   * Clears prediction history from Redis and in-memory.
   */
  async clear() {
    const previousCount = this.records.length;
    this.records = [];

    if (this.isRedisActive()) {
      try {
        await redisClient.del(REDIS_HISTORY_KEY);
      } catch (err) {
        console.warn("[HistoryService] Redis clear failed:", err.message);
      }
    }

    return {
      cleared: true,
      cleared_count: previousCount,
    };
  }

  /**
   * Returns summary stats of stored predictions.
   */
  async getStats() {
    const records = await this.getRecords({ limit: this.maxSize });
    const total = records.length;

    if (total === 0) {
      return {
        total_predictions: 0,
        average_price_lakhs: 0,
        popular_brands: {},
      };
    }

    const sumPrice = records.reduce(
      (sum, r) => sum + (r.predicted_price_lkr_lakhs || 0),
      0
    );

    const brandCounts = {};
    for (const r of records) {
      const b = (r.requested_vehicle?.brand || r.vehicle_summary?.brand || "UNKNOWN").toUpperCase();
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    }

    return {
      total_predictions: total,
      average_price_lakhs: Number((sumPrice / total).toFixed(2)),
      popular_brands: brandCounts,
    };
  }
}

module.exports = new HistoryService(MAX_HISTORY_SIZE);
