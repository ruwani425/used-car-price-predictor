const express = require("express");
const router = express.Router();
const { handleGetAnalytics } = require("../controllers/analyticsController");

// GET /api/analytics & GET /api/metrics
router.get("/", handleGetAnalytics);

module.exports = router;
