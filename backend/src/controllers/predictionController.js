const mlClient = require("../services/mlClient");

/**
 * In-memory store for recent prediction history (persists during runtime, ready for DB).
 */
const recentPredictions = [];
const MAX_HISTORY_ITEMS = 50;

/**
 * Handles POST /api/predict
 * Forwards validated vehicle attributes to ML service and returns enriched prediction.
 */
const handlePrediction = async (req, res, next) => {
  try {
    const payload = req.body;
    const mlResponse = await mlClient.predictPrice(payload);

    // Format display string helper
    const lakhs = mlResponse.predicted_price_lkr_lakhs;
    const lkrRaw = mlResponse.predicted_price_lkr_raw;

    const formattedLKR = `Rs. ${lkrRaw.toLocaleString("en-LK")}`;
    const formattedLakhs = `Rs. ${lakhs.toFixed(2)} Lakhs`;

    const enrichedResponse = {
      ...mlResponse,
      formatted_lkr: formattedLKR,
      formatted_lakhs: formattedLakhs,
      timestamp: new Date().toISOString(),
      requested_vehicle: {
        brand: payload.brand,
        model: payload.model,
        yom: payload.yom,
        fuel_type: payload.fuel_type,
        gear: payload.gear,
        mileage_km: payload.mileage_km,
        town: payload.town,
      },
    };

    // Save to runtime history queue
    recentPredictions.unshift({
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...enrichedResponse,
    });

    if (recentPredictions.length > MAX_HISTORY_ITEMS) {
      recentPredictions.pop();
    }

    return res.status(200).json(enrichedResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /api/history (and /api/predict/history)
 */
const getPredictionHistory = (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  return res.status(200).json({
    status: "success",
    count: recentPredictions.slice(0, limit).length,
    history: recentPredictions.slice(0, limit),
  });
};

module.exports = {
  handlePrediction,
  getPredictionHistory,
};
