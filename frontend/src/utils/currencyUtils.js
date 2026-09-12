/**
 * Frontend Currency Utilities & Exchange Rates.
 * Mirrors backend/src/services/currencyService.js for instant client-side updates.
 */

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
    rateToLKR: 305.5,
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rateToLKR: 332.8,
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rateToLKR: 396.4,
    decimals: 2,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    rateToLKR: 2.05,
    decimals: 0,
  },
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
