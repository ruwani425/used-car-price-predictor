const express = require("express");
const router = express.Router();
const {
  getCurrencies,
  convertCurrency,
  refreshCurrencies,
} = require("../controllers/currencyController");

// GET /api/currencies
router.get("/", getCurrencies);

// POST /api/currencies/convert
router.post("/convert", convertCurrency);

// POST /api/currencies/refresh
router.post("/refresh", refreshCurrencies);

module.exports = router;
