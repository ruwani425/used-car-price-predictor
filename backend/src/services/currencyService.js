const axios = require("axios");
const { getCache, setCache, isRedisAvailable } = require("../config/redis");

/**
 * Multi-Currency Conversion Engine with Open Exchange Rates & Redis Caching.
 * Supported Currencies: LKR (Base), USD ($), EUR (€), GBP (£), JPY (¥).
 */

const REDIS_CACHE_KEY = "currency:exchange_rates:latest";
const CACHE_TTL_SECONDS = 3 * 3600; // 3 Hours (10,800 seconds)

const FALLBACK_RATES = {
  USD: 305.5,
  EUR: 332.8,
  GBP: 396.4,
  JPY: 2.05,
};

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
    rateToLKR: FALLBACK_RATES.USD,
    decimalPlaces: 2,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    rateToLKR: FALLBACK_RATES.EUR,
    decimalPlaces: 2,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    rateToLKR: FALLBACK_RATES.GBP,
    decimalPlaces: 2,
  },
  JPY: {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    rateToLKR: FALLBACK_RATES.JPY,
    decimalPlaces: 0,
  },
};

let lastUpdated = new Date().toISOString();
let rateSource = "Default In-Memory Registry";

/**
 * Fetches real-time live exchange rates from Open Exchange API and stores in Redis cache.
 */
const fetchAndCacheRates = async () => {
  try {
    const appId = process.env.OPEN_EXCHANGE_APP_ID;
    const url = appId
      ? `https://openexchangerates.org/api/latest.json?app_id=${appId}`
      : "https://open.er-api.com/v6/latest/USD";

    const response = await axios.get(url, { timeout: 6000 });
    const rates = response.data && response.data.rates;

    if (rates && rates.LKR) {
      const lkrPerUsd = Number(rates.LKR);
      const computedRates = {
        USD: Number(lkrPerUsd.toFixed(2)),
        EUR: Number((lkrPerUsd / (rates.EUR || 1)).toFixed(2)),
        GBP: Number((lkrPerUsd / (rates.GBP || 1)).toFixed(2)),
        JPY: Number((lkrPerUsd / (rates.JPY || 1)).toFixed(2)),
      };

      // Update in-memory registry
      CURRENCY_REGISTRY.USD.rateToLKR = computedRates.USD;
      CURRENCY_REGISTRY.EUR.rateToLKR = computedRates.EUR;
      CURRENCY_REGISTRY.GBP.rateToLKR = computedRates.GBP;
      CURRENCY_REGISTRY.JPY.rateToLKR = computedRates.JPY;

      lastUpdated = new Date().toISOString();
      rateSource = appId ? "Open Exchange Rates API (Official)" : "Open Exchange Rates API (Live)";

      // Cache in Redis with 3-Hour TTL (10,800 seconds)
      const cachePayload = {
        rates: computedRates,
        source: rateSource,
        lastUpdated,
      };
      await setCache(REDIS_CACHE_KEY, cachePayload, CACHE_TTL_SECONDS);

      console.log(`[Currency Service] Rates updated & cached in Redis for 3 hours: USD=${computedRates.USD}, EUR=${computedRates.EUR}, GBP=${computedRates.GBP}, JPY=${computedRates.JPY}`);
      return { success: true, source: rateSource, lastUpdated, rates: computedRates };
    }
  } catch (error) {
    console.warn(`[Currency Service] Live rate fetch failed (${error.message}). Checking Redis cache or fallback registry.`);
    
    // Attempt retrieving from existing Redis cache
    const cached = await getCache(REDIS_CACHE_KEY);
    if (cached && cached.rates) {
      CURRENCY_REGISTRY.USD.rateToLKR = cached.rates.USD;
      CURRENCY_REGISTRY.EUR.rateToLKR = cached.rates.EUR;
      CURRENCY_REGISTRY.GBP.rateToLKR = cached.rates.GBP;
      CURRENCY_REGISTRY.JPY.rateToLKR = cached.rates.JPY;
      lastUpdated = cached.lastUpdated;
      rateSource = "Redis Cache (Persisted Snapshot)";
      return { success: true, source: rateSource, lastUpdated, rates: cached.rates };
    }

    rateSource = "Fallback Offline Registry";
  }
  return { success: false, source: rateSource, lastUpdated };
};

// Initial sync on startup
fetchAndCacheRates();

/**
 * Converts a raw amount in LKR to a specified target currency.
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
 * Returns list of all supported currencies with symbols, live rates and metadata.
 */
const getAllCurrencies = () => {
  return {
    base_currency: "LKR",
    source: rateSource,
    redis_available: isRedisAvailable(),
    cache_ttl_hours: 3,
    last_updated: lastUpdated,
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
  fetchAndCacheRates,
  convertFromLKR,
  convert,
  getAllCurrencies,
};
