const axios = require("axios");
const { getCache, setCache, isRedisAvailable } = require("../config/redis");

/**
 * Enterprise Multi-Currency Conversion Engine
 * Supported Currencies: LKR (Base), USD ($), EUR (€), GBP (£), JPY (¥).
 * 
 * Features:
 * 1. Open Exchange Rates API live provider
 * 2. Pair-based key caching (e.g. LKR:USD, USD:LKR, LKR:EUR) in Redis ('currency:rates')
 * 3. In-Memory Direct, Inverse & Cross-Rate financial conversion
 * 4. Microsecond in-memory latency + 3-Hour TTL scheduled sync
 */

const REDIS_RATES_KEY = "currency:rates";
const REDIS_LATEST_KEY = "currency:exchange_rates:latest";
const CACHE_TTL_SECONDS = 3 * 3600; // 3 Hours (10,800s)

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

// In-Memory Currency Pair Matrix (e.g. 'LKR:USD', 'USD:LKR', 'LKR:EUR')
let PAIR_RATES = {};
let lastUpdated = new Date().toISOString();
let rateSource = "Default In-Memory Registry";

/**
 * Builds bidirectional currency pair rates from base LKR rates.
 * Formats:
 * - LKR:USD = 1 / usdToLkr
 * - USD:LKR = usdToLkr
 * - LKR:EUR = 1 / eurToLkr
 * - Cross-rate: EUR:USD = (1/usdToLkr) / (1/eurToLkr) = eurToLkr / usdToLkr
 */
const buildPairMatrix = () => {
  const pairs = {};
  const codes = Object.keys(CURRENCY_REGISTRY);

  codes.forEach((from) => {
    codes.forEach((to) => {
      if (from === to) {
        pairs[`${from}:${to}`] = 1.0;
      } else {
        const fromToLkr = CURRENCY_REGISTRY[from].rateToLKR;
        const toToLkr = CURRENCY_REGISTRY[to].rateToLKR;
        // 1 FROM = (fromToLkr / toToLkr) TO
        pairs[`${from}:${to}`] = Number((fromToLkr / toToLkr).toFixed(8));
      }
    });
  });

  PAIR_RATES = pairs;
  return pairs;
};

// Initialize default pairs
buildPairMatrix();

/**
 * Fetches real-time exchange rates from Open Exchange API and synchronizes Redis cache & pair matrix.
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

      // 1. Update Registry
      CURRENCY_REGISTRY.USD.rateToLKR = computedRates.USD;
      CURRENCY_REGISTRY.EUR.rateToLKR = computedRates.EUR;
      CURRENCY_REGISTRY.GBP.rateToLKR = computedRates.GBP;
      CURRENCY_REGISTRY.JPY.rateToLKR = computedRates.JPY;

      // 2. Build Pair Matrix (LKR:USD, USD:LKR, LKR:EUR, etc.)
      const pairs = buildPairMatrix();

      lastUpdated = new Date().toISOString();
      rateSource = appId ? "Open Exchange Rates API (Official)" : "Open Exchange Rates API (Live)";

      // 3. Cache in Redis
      const payload = {
        rates: computedRates,
        pairs,
        source: rateSource,
        lastUpdated,
      };

      await setCache(REDIS_LATEST_KEY, payload, CACHE_TTL_SECONDS);
      await setCache(REDIS_RATES_KEY, pairs, CACHE_TTL_SECONDS);

      console.log(`[Currency Service] Live rates & pair matrix synced via ${rateSource}: USD=${computedRates.USD}, EUR=${computedRates.EUR}, GBP=${computedRates.GBP}, JPY=${computedRates.JPY}`);
      return { success: true, source: rateSource, lastUpdated, rates: computedRates, pairs };
    }
  } catch (error) {
    console.warn(`[Currency Service] Live rate fetch failed (${error.message}). Checking Redis cache or fallback registry.`);

    // Attempt restoring from Redis cache
    const cachedPairs = await getCache(REDIS_RATES_KEY);
    const cachedLatest = await getCache(REDIS_LATEST_KEY);

    if (cachedPairs && cachedLatest) {
      PAIR_RATES = cachedPairs;
      if (cachedLatest.rates) {
        CURRENCY_REGISTRY.USD.rateToLKR = cachedLatest.rates.USD;
        CURRENCY_REGISTRY.EUR.rateToLKR = cachedLatest.rates.EUR;
        CURRENCY_REGISTRY.GBP.rateToLKR = cachedLatest.rates.GBP;
        CURRENCY_REGISTRY.JPY.rateToLKR = cachedLatest.rates.JPY;
      }
      lastUpdated = cachedLatest.lastUpdated || lastUpdated;
      rateSource = "Redis Cache (Persisted Snapshot)";
      return { success: true, source: rateSource, lastUpdated, pairs: cachedPairs };
    }

    buildPairMatrix();
    rateSource = "Fallback Offline Registry";
  }
  return { success: false, source: rateSource, lastUpdated, pairs: PAIR_RATES };
};

// Initial startup sync
fetchAndCacheRates();

/**
 * In-Memory Financial Arithmetic Calculation using Pair Matrix & Cross-Rates.
 * 
 * @param {number} amount - Amount to convert
 * @param {string} from - Source currency code (e.g. 'LKR')
 * @param {string} to - Target currency code (e.g. 'USD')
 * @returns {number} Converted value
 */
const convertAmountInMemory = (amount, from = "LKR", to = "USD") => {
  const fromCode = (from || "LKR").trim().toUpperCase();
  const toCode = (to || "USD").trim().toUpperCase();

  if (fromCode === toCode) return Number(amount);

  const directPair = `${fromCode}:${toCode}`;
  const inversePair = `${toCode}:${fromCode}`;

  let converted = 0;
  if (PAIR_RATES[directPair]) {
    // 1. Direct pair exists in matrix
    converted = Number(amount) * PAIR_RATES[directPair];
  } else if (PAIR_RATES[inversePair]) {
    // 2. Inverse pair exists in matrix
    converted = Number(amount) / PAIR_RATES[inversePair];
  } else if (PAIR_RATES[`LKR:${toCode}`] && PAIR_RATES[`LKR:${fromCode}`]) {
    // 3. Cross-rate calculation via base LKR pivot
    const crossRate = PAIR_RATES[`LKR:${toCode}`] / PAIR_RATES[`LKR:${fromCode}`];
    converted = Number(amount) * crossRate;
  } else {
    // Fallback registry calculation
    const fromInfo = CURRENCY_REGISTRY[fromCode] || CURRENCY_REGISTRY.LKR;
    const toInfo = CURRENCY_REGISTRY[toCode] || CURRENCY_REGISTRY.USD;
    const inLkr = Number(amount) * fromInfo.rateToLKR;
    converted = inLkr / toInfo.rateToLKR;
  }

  const targetInfo = CURRENCY_REGISTRY[toCode] || CURRENCY_REGISTRY.USD;
  return Number(converted.toFixed(targetInfo.decimalPlaces));
};

/**
 * Converts a raw amount in LKR to a target currency with rich metadata.
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
    pair_rate: PAIR_RATES[`LKR:${normalizedTarget}`] || (1 / currencyInfo.rateToLKR),
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
  const effectiveRate = PAIR_RATES[pairKey] || Number((fromInfo.rateToLKR / toInfo.rateToLKR).toFixed(6));

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
 * Returns list of all supported currencies, pair matrix and metadata.
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
      description: `1 ${c.code} = ${c.rateToLKR} LKR`,
    })),
  };
};

module.exports = {
  CURRENCY_REGISTRY,
  PAIR_RATES,
  fetchAndCacheRates,
  convertAmountInMemory,
  convertFromLKR,
  convert,
  getAllCurrencies,
};
