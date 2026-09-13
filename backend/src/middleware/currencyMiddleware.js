/**
 * Request Header Currency Resolution Middleware.
 * Extracts client preferred currency from headers:
 * - x-currency-code
 * - x-currency
 * - currency
 * Or query param: ?currency=USD
 * Defaults to 'LKR' if not specified or unsupported.
 */

const SUPPORTED_CURRENCIES = ["LKR", "USD", "EUR", "GBP", "JPY"];

const getRequestedCurrency = (req) => {
  const headerCode =
    req?.headers?.["x-currency-code"] ||
    req?.headers?.["x-currency"] ||
    req?.headers?.["currency"] ||
    req?.query?.currency ||
    req?.body?.target_currency;

  if (headerCode && typeof headerCode === "string") {
    const normalized = headerCode.trim().toUpperCase();
    if (SUPPORTED_CURRENCIES.includes(normalized)) {
      return normalized;
    }
  }

  return "LKR";
};

const currencyMiddleware = (req, res, next) => {
  req.preferredCurrency = getRequestedCurrency(req);
  next();
};

module.exports = {
  currencyMiddleware,
  getRequestedCurrency,
  SUPPORTED_CURRENCIES,
};
