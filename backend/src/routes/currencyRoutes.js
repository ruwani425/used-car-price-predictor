const express = require("express");
const router = express.Router();
const {
  getCurrencies,
  convertCurrency,
} = require("../controllers/currencyController");

// GET /api/currencies
router.get("/", getCurrencies);

// POST /api/currencies/convert
router.post("/convert", convertCurrency);

module.exports = router;
