const express = require("express");
const router = express.Router();
const {
  getHistory,
  getHistoryStats,
  getHistoryById,
  clearHistory,
} = require("../controllers/historyController");

// GET /api/history
router.get("/", getHistory);

// GET /api/history/stats
router.get("/stats", getHistoryStats);

// DELETE /api/history & POST /api/history/clear
router.delete("/", clearHistory);
router.post("/clear", clearHistory);

// GET /api/history/:id
router.get("/:id", getHistoryById);

module.exports = router;
