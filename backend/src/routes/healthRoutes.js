const express = require("express");
const router = express.Router();
const { handleHealthCheck } = require("../controllers/healthController");

// GET /api/health
router.get("/", handleHealthCheck);

module.exports = router;
