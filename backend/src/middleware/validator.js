/**
 * Request payload validation middleware for Used Car Price Predictor.
 * Validates input types, bounds, and required attributes.
 */

const validatePredictionPayload = (req, res, next) => {
  const {
    brand,
    model,
    yom,
    engine_cc,
    mileage_km,
  } = req.body;

  const errors = [];

  // Required string validations
  if (!brand || typeof brand !== "string" || brand.trim() === "") {
    errors.push("Field 'brand' is required and must be a non-empty string.");
  }

  if (!model || typeof model !== "string" || model.trim() === "") {
    errors.push("Field 'model' is required and must be a non-empty string.");
  }

  // Year of Manufacture validation
  const currentYear = new Date().getFullYear();
  const yomNum = Number(yom);
  if (!yom || isNaN(yomNum) || yomNum < 1950 || yomNum > currentYear + 1) {
    errors.push(`Field 'yom' (Year of Manufacture) must be an integer between 1950 and ${currentYear + 1}.`);
  }

  // Engine CC validation
  const ccNum = Number(engine_cc);
  if (!engine_cc || isNaN(ccNum) || ccNum <= 0 || ccNum > 8000) {
    errors.push("Field 'engine_cc' must be a positive number up to 8000 cc.");
  }

  // Mileage KM validation
  const mileageNum = Number(mileage_km);
  if (mileage_km === undefined || mileage_km === null || isNaN(mileageNum) || mileageNum < 0) {
    errors.push("Field 'mileage_km' must be a non-negative number.");
  }

  // Optional string / enum checks
  if (req.body.gear && !["Automatic", "Manual"].includes(req.body.gear)) {
    // Default or sanitize
    req.body.gear = "Automatic";
  }

  if (req.body.fuel_type && !["Petrol", "Hybrid", "Diesel", "Electric"].includes(req.body.fuel_type)) {
    req.body.fuel_type = "Petrol";
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: "error",
      error_type: "ValidationError",
      message: "Invalid input attributes provided.",
      errors,
    });
  }

  const normalizeAmenity = (val) => {
    if (val === true || val === 1 || val === "true" || val === "Available" || val === "available") {
      return "Available";
    }
    if (val === false || val === 0 || val === "false" || val === "Not_Available" || val === "not_available") {
      return "Not_Available";
    }
    return typeof val === "string" ? val.trim() : "Available";
  };

  // Standardize numeric and boolean types in req.body
  req.body.brand = brand.trim().toUpperCase();
  req.body.model = model.trim().toUpperCase();
  req.body.yom = Math.round(yomNum);
  req.body.engine_cc = parseFloat(ccNum);
  req.body.mileage_km = parseFloat(mileageNum);
  req.body.town = (req.body.town ? String(req.body.town) : "Colombo").trim();
  req.body.condition = (req.body.condition ? String(req.body.condition) : "USED").trim().toUpperCase();
  req.body.leasing = (req.body.leasing ? String(req.body.leasing) : "No Leasing").trim();
  req.body.air_condition = normalizeAmenity(req.body.air_condition);
  req.body.power_steering = normalizeAmenity(req.body.power_steering);
  req.body.power_mirror = normalizeAmenity(req.body.power_mirror);
  req.body.power_window = normalizeAmenity(req.body.power_window);
  req.body.target_currency = (req.body.target_currency ? String(req.body.target_currency) : "LKR").trim().toUpperCase();

  next();
};

module.exports = {
  validatePredictionPayload,
};
