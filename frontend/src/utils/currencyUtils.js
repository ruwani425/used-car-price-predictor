// Helper utilities for currency conversion and exchange rate configuration

export const CURRENCY_CONFIG = {
  LKR: {
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    symbol: 'Rs.',
    rateToLKR: 1.0,
    decimals: 0,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rateToLKR: 328.29, // Dynamically updated from Backend Redis
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rateToLKR: 380.89, // Dynamically updated from Backend Redis
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rateToLKR: 444.15, // Dynamically updated from Backend Redis
    decimals: 2,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    rateToLKR: 2.14, // Dynamically updated from Backend Redis
    decimals: 0,
  },
};

/**
 * Updates dynamic exchange rates from Backend Redis Cache.
 */
export const updateCurrencyRates = (rates) => {
  if (!rates || typeof rates !== 'object') return;
  if (rates.USD) CURRENCY_CONFIG.USD.rateToLKR = Number(rates.USD);
  if (rates.EUR) CURRENCY_CONFIG.EUR.rateToLKR = Number(rates.EUR);
  if (rates.GBP) CURRENCY_CONFIG.GBP.rateToLKR = Number(rates.GBP);
  if (rates.JPY) CURRENCY_CONFIG.JPY.rateToLKR = Number(rates.JPY);
};

/**
 * Converts a raw LKR value to the requested target currency.
 */
export const convertFromLKR = (lkrRaw, targetCurrency = 'LKR') => {
  const norm = (targetCurrency || 'LKR').trim().toUpperCase();
  const config = CURRENCY_CONFIG[norm] || CURRENCY_CONFIG.LKR;

  const rawConverted = Number(lkrRaw) / config.rateToLKR;
  const amount = Number(rawConverted.toFixed(config.decimals));

  const formatted =
    norm === 'LKR'
      ? `Rs. ${(Number(lkrRaw) / 100000).toFixed(2)} Lakhs`
      : `${config.symbol} ${amount.toLocaleString('en-US', {
          minimumFractionDigits: config.decimals,
          maximumFractionDigits: config.decimals,
        })}`;

  return {
    currency: config.code,
    symbol: config.symbol,
    rate: config.rateToLKR,
    amount,
    formatted,
  };
};
