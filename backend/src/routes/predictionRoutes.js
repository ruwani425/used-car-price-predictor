const express = require("express");
const router = express.Router();
const { validatePredictionPayload } = require("../middleware/validator");
const {
  handlePrediction,
  getPredictionHistory,
} = require("../controllers/predictionController");

// POST /api/predict (Validates input -> Proxies to ML service -> Returns enriched response)
router.post("/", validatePredictionPayload, handlePrediction);

// GET /api/predict/history
router.get("/history", getPredictionHistory);

module.exports = router;
