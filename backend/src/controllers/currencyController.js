const currencyService = require("../services/currencyService");

/**
 * GET /api/currencies
 * Returns all supported currencies, exchange rates against LKR, and symbols.
 */
const getCurrencies = (req, res) => {
  const data = currencyService.getAllCurrencies();
  return res.status(200).json({
    status: "success",
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

module.exports = {
  getCurrencies,
  convertCurrency,
};
