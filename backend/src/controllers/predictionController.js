const mlClient = require("../services/mlClient");
const currencyService = require("../services/currencyService");
const historyService = require("../services/historyService");

/**
 * Handles POST /api/predict
 * Forwards validated vehicle attributes to ML service, performs multi-currency conversion,
 * records in history service, and returns fully enriched payload matching assignment spec.
 */
const handlePrediction = async (req, res, next) => {
  try {
    const payload = req.body;
    const targetCurrency = req.preferredCurrency || payload.target_currency || req.query.currency || "USD";

    // Call ML Microservice
    const mlResponse = await mlClient.predictPrice(payload);

    const lakhs = mlResponse.predicted_price_lkr_lakhs;
    const lkrRaw = mlResponse.predicted_price_lkr_raw;

    // Currency Conversion (Technique / Engine)
    const convertedPrice = currencyService.convertFromLKR(lkrRaw, targetCurrency);

    // Format display string helper
    const formattedLKR = `Rs. ${lkrRaw.toLocaleString("en-LK")}`;
    const formattedLakhs = `Rs. ${lakhs.toFixed(2)} Lakhs`;

    // Convert depreciation projection points to selected currency as well
    const enrichedDepreciation = (mlResponse.depreciation_projection || []).map((point) => {
      const pointConverted = currencyService.convertFromLKR(
        point.projected_price_lkr_raw,
        targetCurrency
      );
      return {
        ...point,
        projected_price_converted: pointConverted.amount,
        projected_price_converted_formatted: pointConverted.formatted,
      };
    });

    // Convert confidence intervals to selected currency
    let convertedConfidence = null;
    if (mlResponse.confidence_interval) {
      const minRaw = Math.round(mlResponse.confidence_interval.min_lkr_lakhs * 100000);
      const maxRaw = Math.round(mlResponse.confidence_interval.max_lkr_lakhs * 100000);
      const minConv = currencyService.convertFromLKR(minRaw, targetCurrency);
      const maxConv = currencyService.convertFromLKR(maxRaw, targetCurrency);
      convertedConfidence = {
        min_amount: minConv.amount,
        max_amount: maxConv.amount,
        min_formatted: minConv.formatted,
        max_formatted: maxConv.formatted,
      };
    }

    const enrichedResponse = {
      status: "success",
      predicted_price_lkr_lakhs: lakhs,
      predicted_price_lkr_raw: lkrRaw,
      converted_price: {
        currency: convertedPrice.currency,
        symbol: convertedPrice.symbol,
        rate: convertedPrice.rate,
        amount: convertedPrice.amount,
        formatted: convertedPrice.formatted,
      },
      confidence_interval: mlResponse.confidence_interval,
      converted_confidence_interval: convertedConfidence,
      depreciation_projection: enrichedDepreciation,
      formatted_lkr: formattedLKR,
      formatted_lakhs: formattedLakhs,
      model_used: mlResponse.model_used,
      timestamp: new Date().toISOString(),
      requested_vehicle: {
        brand: payload.brand,
        model: payload.model,
        yom: payload.yom,
        engine_cc: payload.engine_cc,
        fuel_type: payload.fuel_type,
        gear: payload.gear,
        mileage_km: payload.mileage_km,
        town: payload.town,
        condition: payload.condition,
        leasing: payload.leasing,
      },
    };

    // Save to centralized runtime history service
    const savedRecord = historyService.addRecord(enrichedResponse);
    enrichedResponse.history_id = savedRecord.id;

    return res.status(200).json(enrichedResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy/compat wrapper for GET /api/history
 */
const getPredictionHistory = (req, res) => {
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
    history: records,
  });
};

module.exports = {
  handlePrediction,
  getPredictionHistory,
};
