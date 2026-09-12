/**
 * Multi-Currency Conversion Engine for Used Car Price Valuation System.
 * Supported Currencies: LKR (Lakhs & Millions), USD ($), EUR (€), GBP (£), JPY (¥).
 */

const CURRENCY_REGISTRY = {
  LKR: {
    code: "LKR",
    name: "Sri Lankan Rupee",
    symbol: "Rs.",
    rateToLKR: 1.0, // Base currency
    decimalPlaces: 0,
  },
  USD: {
    code: "USD",
    name: "United States Dollar",
    symbol: "$",
    rateToLKR: 305.5, // 1 USD = 305.50 LKR
    decimalPlaces: 2,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    rateToLKR: 332.8, // 1 EUR = 332.80 LKR
    decimalPlaces: 2,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    rateToLKR: 396.4, // 1 GBP = 396.40 LKR
    decimalPlaces: 2,
  },
  JPY: {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    rateToLKR: 2.05, // 1 JPY = 2.05 LKR
    decimalPlaces: 0,
  },
};

/**
 * Converts a raw amount in LKR to a specified target currency.
 * 
 * @param {number} rawLkrAmount - Vehicle price in raw Sri Lankan Rupees (e.g. 9850000)
 * @param {string} targetCurrency - Target currency ISO code (e.g. "USD")
 * @returns {object} Converted price details matching assignment contract
 */
const convertFromLKR = (rawLkrAmount, targetCurrency = "LKR") => {
  const normalizedTarget = (targetCurrency || "LKR").trim().toUpperCase();
  const currencyInfo = CURRENCY_REGISTRY[normalizedTarget] || CURRENCY_REGISTRY.LKR;

  const rate = currencyInfo.rateToLKR;
  const rawConverted = rawLkrAmount / rate;
  const amount = Number(rawConverted.toFixed(currencyInfo.decimalPlaces));

  let formattedAmount = "";
  if (normalizedTarget === "LKR") {
    const lakhs = rawLkrAmount / 100000;
    formattedAmount = `Rs. ${lakhs.toFixed(2)} Lakhs (Rs. ${rawLkrAmount.toLocaleString("en-LK")})`;
  } else {
    formattedAmount = `${currencyInfo.symbol} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: currencyInfo.decimalPlaces,
      maximumFractionDigits: currencyInfo.decimalPlaces,
    })}`;
  }

  return {
    currency: currencyInfo.code,
    symbol: currencyInfo.symbol,
    rate: rate,
    amount: amount,
    formatted: formattedAmount,
  };
};

/**
 * Converts any amount between any supported currencies.
 */
const convert = (amount, fromCurrency = "LKR", toCurrency = "USD") => {
  const fromInfo = CURRENCY_REGISTRY[(fromCurrency || "LKR").trim().toUpperCase()] || CURRENCY_REGISTRY.LKR;
  const toInfo = CURRENCY_REGISTRY[(toCurrency || "USD").trim().toUpperCase()] || CURRENCY_REGISTRY.USD;

  // Convert to base LKR first, then to target currency
  const inLKR = Number(amount) * fromInfo.rateToLKR;
  const convertedAmount = Number((inLKR / toInfo.rateToLKR).toFixed(toInfo.decimalPlaces));

  return {
    from: fromInfo.code,
    to: toInfo.code,
    original_amount: Number(amount),
    converted_amount: convertedAmount,
    rate: Number((fromInfo.rateToLKR / toInfo.rateToLKR).toFixed(4)),
    formatted: `${toInfo.symbol} ${convertedAmount.toLocaleString("en-US", {
      minimumFractionDigits: toInfo.decimalPlaces,
      maximumFractionDigits: toInfo.decimalPlaces,
    })}`,
  };
};

/**
 * Returns list of all supported currencies with symbols and rates.
 */
const getAllCurrencies = () => {
  return {
    base_currency: "LKR",
    last_updated: new Date().toISOString(),
    currencies: Object.values(CURRENCY_REGISTRY).map((c) => ({
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      rate_against_lkr: c.rateToLKR,
      description: `1 ${c.code} = ${c.rateToLKR} LKR`,
    })),
  };
};

module.exports = {
  CURRENCY_REGISTRY,
  convertFromLKR,
  convert,
  getAllCurrencies,
};
