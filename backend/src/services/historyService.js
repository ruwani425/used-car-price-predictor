/**
 * Prediction History Service for Used Car Price Predictor.
 * Manages runtime prediction records with filtering, searching, and eviction limits.
 */

class HistoryService {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.records = [];
  }

  /**
   * Adds a new prediction record to the top of the history list.
   */
  addRecord(record) {
    const historyItem = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...record,
    };

    this.records.unshift(historyItem);

    if (this.records.length > this.maxSize) {
      this.records.pop();
    }

    return historyItem;
  }

  /**
   * Retrieves records with optional filtering (brand, price range, limit).
   */
  getRecords({ limit = 10, brand = null, minPrice = null, maxPrice = null }) {
    let filtered = this.records;

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
  getById(id) {
    return this.records.find((r) => r.id === id) || null;
  }

  /**
   * Clears all stored records.
   */
  clear() {
    const previousCount = this.records.length;
    this.records = [];
    return {
      cleared: true,
      cleared_count: previousCount,
    };
  }

  /**
   * Returns summary stats of stored predictions.
   */
  getStats() {
    const total = this.records.length;
    if (total === 0) {
      return {
        total_predictions: 0,
        average_price_lakhs: 0,
        popular_brands: {},
      };
    }

    const sumPrice = this.records.reduce(
      (sum, r) => sum + (r.predicted_price_lkr_lakhs || 0),
      0
    );

    const brandCounts = {};
    for (const r of this.records) {
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

// Export singleton instance
module.exports = new HistoryService(100);
