const axios = require("axios");
const { getCache, setCache, isRedisAvailable } = require("../config/redis");

/**
 * Enterprise Multi-Currency Conversion Engine (Redis Cache-Driven)
 * Supported Currencies: LKR (Base), USD ($), EUR (€), GBP (£), JPY (¥).
 * 
 * Rules:
 * - NO HARDCODED EXCHANGE RATES
 * - All rates & pairs are retrieved dynamically from Redis Cache ('currency:rates')
 * - On cache miss/expiry, synchronizes from Open Exchange Rates API directly into Redis
 */

const REDIS_RATES_KEY = "currency:rates";
const REDIS_LATEST_KEY = "currency:exchange_rates:latest";
const CACHE_TTL_SECONDS = 3 * 3600; // 3 Hours TTL

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
    rateToLKR: null,
    decimalPlaces: 2,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    rateToLKR: null,
    decimalPlaces: 2,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    rateToLKR: null,
    decimalPlaces: 2,
  },
  JPY: {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    rateToLKR: null,
    decimalPlaces: 0,
  },
};

let PAIR_RATES = {};
let lastUpdated = null;
let rateSource = "Uninitialized";

/**
 * Computes pair matrix (LKR:USD, USD:LKR, etc.) from base rates.
 */
const computePairMatrixFromBaseRates = (rates) => {
  const pairs = { "LKR:LKR": 1.0 };
  const codes = ["LKR", "USD", "EUR", "GBP", "JPY"];

  codes.forEach((from) => {
    codes.forEach((to) => {
      if (from === to) {
        pairs[`${from}:${to}`] = 1.0;
      } else {
        const fromToLkr = from === "LKR" ? 1.0 : rates[from];
        const toToLkr = to === "LKR" ? 1.0 : rates[to];
        if (fromToLkr && toToLkr) {
          pairs[`${from}:${to}`] = Number((fromToLkr / toToLkr).toFixed(8));
        }
      }
    });
  });

  return pairs;
};

/**
 * Updates in-memory registry & pairs from a validated rates object.
 */
const applyRates = (rates, pairs, source, timestamp) => {
  if (rates.USD) CURRENCY_REGISTRY.USD.rateToLKR = rates.USD;
  if (rates.EUR) CURRENCY_REGISTRY.EUR.rateToLKR = rates.EUR;
  if (rates.GBP) CURRENCY_REGISTRY.GBP.rateToLKR = rates.GBP;
  if (rates.JPY) CURRENCY_REGISTRY.JPY.rateToLKR = rates.JPY;

  PAIR_RATES = pairs || computePairMatrixFromBaseRates(rates);
  lastUpdated = timestamp || new Date().toISOString();
  rateSource = source || "Redis Cache";
};

/**
 * Fetches real-time exchange rates from Open Exchange API and populates Redis.
 */
const fetchAndCacheRates = async () => {
  try {
    const appId = process.env.OPEN_EXCHANGE_APP_ID;
    const url = appId
      ? `https://openexchangerates.org/api/latest.json?app_id=${appId}`
      : "https://open.er-api.com/v6/latest/USD";

    const response = await axios.get(url, { timeout: 8000 });
    const rates = response.data && response.data.rates;

    if (rates && rates.LKR) {
      const lkrPerUsd = Number(rates.LKR);
      const computedRates = {
        USD: Number(lkrPerUsd.toFixed(2)),
        EUR: Number((lkrPerUsd / (rates.EUR || 1)).toFixed(2)),
        GBP: Number((lkrPerUsd / (rates.GBP || 1)).toFixed(2)),
        JPY: Number((lkrPerUsd / (rates.JPY || 1)).toFixed(2)),
      };

      const pairs = computePairMatrixFromBaseRates(computedRates);
      const timestamp = new Date().toISOString();
      const source = appId ? "Open Exchange Rates API (Official)" : "Open Exchange Rates API (Live)";

      // Store in Redis Cache
      const payload = {
        rates: computedRates,
        pairs,
        source,
        lastUpdated: timestamp,
      };

      await setCache(REDIS_LATEST_KEY, payload, CACHE_TTL_SECONDS);
      await setCache(REDIS_RATES_KEY, pairs, CACHE_TTL_SECONDS);

      // Apply to active memory
      applyRates(computedRates, pairs, source, timestamp);

      console.log(`[Currency Service] Live exchange rates successfully stored in Redis (Source: ${source})`);
      return { success: true, source, lastUpdated: timestamp, rates: computedRates, pairs };
    }
  } catch (error) {
    console.error(`[Currency Service] Failed to fetch live exchange rates: ${error.message}`);
  }

  return { success: false, source: rateSource, lastUpdated };
};

/**
 * Loads rates strictly from Redis cache; if missing, triggers API sync into Redis.
 */
const syncFromRedisOrProvider = async () => {
  try {
    // 1. Check Redis Cache
    const cachedLatest = await getCache(REDIS_LATEST_KEY);
    const cachedPairs = await getCache(REDIS_RATES_KEY);

    if (cachedLatest && cachedLatest.rates) {
      applyRates(
        cachedLatest.rates,
        cachedPairs || cachedLatest.pairs,
        "Redis Cache (Dynamic Store)",
        cachedLatest.lastUpdated
      );
      return { success: true, fromCache: true, source: rateSource };
    }

    // 2. Cache miss -> Fetch from Open Exchange API and populate Redis
    console.log("[Currency Service] Redis cache empty. Fetching from Open Exchange API to seed Redis...");
    return await fetchAndCacheRates();
  } catch (err) {
    console.error("[Currency Service] Sync error:", err.message);
    return { success: false, error: err.message };
  }
};

// Immediate initialization on boot
syncFromRedisOrProvider();

/**
 * In-Memory Financial Arithmetic Calculation using Redis Pair Matrix.
 */
const convertAmountInMemory = (amount, from = "LKR", to = "USD") => {
  const fromCode = (from || "LKR").trim().toUpperCase();
  const toCode = (to || "USD").trim().toUpperCase();

  if (fromCode === toCode) return Number(amount);

  const directPair = `${fromCode}:${toCode}`;
  const inversePair = `${toCode}:${fromCode}`;

  let converted = 0;
  if (PAIR_RATES[directPair]) {
    converted = Number(amount) * PAIR_RATES[directPair];
  } else if (PAIR_RATES[inversePair]) {
    converted = Number(amount) / PAIR_RATES[inversePair];
  } else if (PAIR_RATES[`LKR:${toCode}`] && PAIR_RATES[`LKR:${fromCode}`]) {
    const crossRate = PAIR_RATES[`LKR:${toCode}`] / PAIR_RATES[`LKR:${fromCode}`];
    converted = Number(amount) * crossRate;
  } else {
    const fromRate = CURRENCY_REGISTRY[fromCode]?.rateToLKR || 1.0;
    const toRate = CURRENCY_REGISTRY[toCode]?.rateToLKR || 1.0;
    const inLkr = Number(amount) * fromRate;
    converted = inLkr / toRate;
  }

  const targetInfo = CURRENCY_REGISTRY[toCode] || CURRENCY_REGISTRY.USD;
  return Number(converted.toFixed(targetInfo.decimalPlaces));
};

/**
 * Converts raw LKR amount to target currency.
 */
const convertFromLKR = (rawLkrAmount, targetCurrency = "LKR") => {
  const normalizedTarget = (targetCurrency || "LKR").trim().toUpperCase();
  const currencyInfo = CURRENCY_REGISTRY[normalizedTarget] || CURRENCY_REGISTRY.LKR;

  const convertedAmount = convertAmountInMemory(rawLkrAmount, "LKR", normalizedTarget);

  let formattedAmount = "";
  if (normalizedTarget === "LKR") {
    const lakhs = rawLkrAmount / 100000;
    formattedAmount = `Rs. ${lakhs.toFixed(2)} Lakhs (Rs. ${rawLkrAmount.toLocaleString("en-LK")})`;
  } else {
    formattedAmount = `${currencyInfo.symbol} ${convertedAmount.toLocaleString("en-US", {
      minimumFractionDigits: currencyInfo.decimalPlaces,
      maximumFractionDigits: currencyInfo.decimalPlaces,
    })}`;
  }

  return {
    currency: currencyInfo.code,
    symbol: currencyInfo.symbol,
    rate: currencyInfo.rateToLKR,
    pair_rate: PAIR_RATES[`LKR:${normalizedTarget}`] || (currencyInfo.rateToLKR ? (1 / currencyInfo.rateToLKR) : 1),
    amount: convertedAmount,
    formatted: formattedAmount,
  };
};

/**
 * Converts any amount between any supported currencies.
 */
const convert = (amount, fromCurrency = "LKR", toCurrency = "USD") => {
  const fromCode = (fromCurrency || "LKR").trim().toUpperCase();
  const toCode = (toCurrency || "USD").trim().toUpperCase();

  const fromInfo = CURRENCY_REGISTRY[fromCode] || CURRENCY_REGISTRY.LKR;
  const toInfo = CURRENCY_REGISTRY[toCode] || CURRENCY_REGISTRY.USD;

  const convertedAmount = convertAmountInMemory(amount, fromCode, toCode);
  const pairKey = `${fromCode}:${toCode}`;
  const effectiveRate = PAIR_RATES[pairKey] || (fromInfo.rateToLKR && toInfo.rateToLKR ? Number((fromInfo.rateToLKR / toInfo.rateToLKR).toFixed(6)) : 1);

  return {
    from: fromInfo.code,
    to: toInfo.code,
    original_amount: Number(amount),
    converted_amount: convertedAmount,
    pair: pairKey,
    rate: effectiveRate,
    formatted: `${toInfo.symbol} ${convertedAmount.toLocaleString("en-US", {
      minimumFractionDigits: toInfo.decimalPlaces,
      maximumFractionDigits: toInfo.decimalPlaces,
    })}`,
  };
};

/**
 * Returns all active currencies and pair matrix metadata.
 */
const getAllCurrencies = () => {
  return {
    base_currency: "LKR",
    source: rateSource,
    redis_available: isRedisAvailable(),
    cache_ttl_hours: 3,
    last_updated: lastUpdated,
    pairs: PAIR_RATES,
    currencies: Object.values(CURRENCY_REGISTRY).map((c) => ({
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      rate_against_lkr: c.rateToLKR,
      pair_lkr_to_curr: PAIR_RATES[`LKR:${c.code}`],
      description: c.rateToLKR ? `1 ${c.code} = ${c.rateToLKR} LKR` : "Loading...",
    })),
  };
};

module.exports = {
  CURRENCY_REGISTRY,
  PAIR_RATES,
  fetchAndCacheRates,
  syncFromRedisOrProvider,
  convertAmountInMemory,
  convertFromLKR,
  convert,
  getAllCurrencies,
};
