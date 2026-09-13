const currencyService = require("../services/currencyService");

/**
 * GET /api/currencies
 * Returns all supported currencies, exchange rates against LKR, and symbols.
 */
const getCurrencies = (req, res) => {
  const data = currencyService.getAllCurrencies();
  const rates = {};
  data.currencies.forEach((c) => {
    rates[c.code] = c.rate_against_lkr;
  });

  return res.status(200).json({
    status: "success",
    base_currency: data.base_currency,
    source: data.source,
    redis_available: data.redis_available,
    last_updated: data.last_updated,
    currencies: data.currencies,
    rates,
    data,
  });
};

/**
 * POST /api/currencies/convert
 * Request Body: { amount: 1000000, from: "LKR", to: "USD" }
 */
const convertCurrency = (req, res) => {
  const { amount, from, to } = req.body;

  if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide a valid non-negative 'amount' number.",
    });
  }

  const result = currencyService.convert(amount, from, to);
  return res.status(200).json({
    status: "success",
    result,
  });
};

/**
 * POST /api/currencies/refresh
 * Forces real-time synchronization with Open Exchange Rates API.
 */
const refreshCurrencies = async (req, res) => {
  const syncResult = await currencyService.fetchAndCacheRates();
  const data = currencyService.getAllCurrencies();

  return res.status(200).json({
    status: "success",
    message: syncResult.success
      ? "Exchange rates successfully synchronized with Open Exchange Rates API and cached in Redis."
      : "Synchronization failed; operating on fallback exchange rates.",
    source: data.source,
    last_updated: data.last_updated,
    currencies: data.currencies,
  });
};

module.exports = {
  getCurrencies,
  convertCurrency,
  refreshCurrencies,
};
