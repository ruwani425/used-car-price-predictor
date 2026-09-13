const cron = require("node-cron");
const currencyService = require("../services/currencyService");

// Default: Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
const CRON_SCHEDULE = process.env.CURRENCY_CRON_SCHEDULE || "0 */3 * * *";

let scheduledTask = null;

/**
 * Background cron job for currency exchange rate synchronization.
 * Fetches fresh rates from Open Exchange API every 3 hours and updates Redis.
 */
const startCurrencyCron = () => {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  console.log(`[Currency Cron] Scheduled currency sync: '${CRON_SCHEDULE}' (every 3 hours)`);

  scheduledTask = cron.schedule(CRON_SCHEDULE, async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[Currency Cron] [${timestamp}] Syncing exchange rates...`);

    try {
      const result = await currencyService.fetchAndCacheRates();
      if (result.success) {
        console.log(`[Currency Cron] [${timestamp}] Exchange rates updated in Redis (Source: ${result.source})`);
      } else {
        console.warn(`[Currency Cron] [${timestamp}] Live sync failed, using fallback rates.`);
      }
    } catch (error) {
      console.error(`[Currency Cron] [${timestamp}] Error during currency sync:`, error.message);
    }
  });

  return scheduledTask;
};

const stopCurrencyCron = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Currency Cron] Currency sync job stopped.");
  }
};

module.exports = {
  startCurrencyCron,
  stopCurrencyCron,
  CRON_SCHEDULE,
};
