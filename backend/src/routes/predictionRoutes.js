const express = require("express");
const router = express.Router();
const { validatePredictionPayload } = require("../middleware/validator");
const {
  handlePrediction,
  getPredictionHistory,
} = require("../controllers/predictionController");

// POST /api/predict - validate vehicle input and compute valuation
router.post("/", validatePredictionPayload, handlePrediction);

// GET /api/predict/history - retrieve recent valuation history
router.get("/history", getPredictionHistory);

module.exports = router;
