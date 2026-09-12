const cron = require("node-cron");
const currencyService = require("../services/currencyService");

// Default: Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
const CRON_SCHEDULE = process.env.CURRENCY_CRON_SCHEDULE || "0 */3 * * *";

let scheduledTask = null;

/**
 * Initializes and starts the currency exchange rate synchronization cron job.
 * Executes every 3 hours to fetch rates from Open Exchange API and update Redis cache.
 */
const startCurrencyCron = () => {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  console.log(`[Cron Engine] Initializing Currency Sync Cron Job with schedule: '${CRON_SCHEDULE}' (Runs every 3 hours)`);

  scheduledTask = cron.schedule(CRON_SCHEDULE, async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[Cron Engine] [${timestamp}] Triggering 3-Hour Scheduled Currency Exchange Rate Sync...`);

    try {
      const result = await currencyService.fetchAndCacheRates();
      if (result.success) {
        console.log(`[Cron Engine] [${timestamp}] ✅ Currency rates successfully synchronized and cached in Redis (Source: ${result.source})`);
      } else {
        console.warn(`[Cron Engine] [${timestamp}] ⚠️ Live sync failed. Fallback rates remain active.`);
      }
    } catch (error) {
      console.error(`[Cron Engine] [${timestamp}] ❌ Error during scheduled currency sync:`, error.message);
    }
  });

  return scheduledTask;
};

const stopCurrencyCron = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Cron Engine] Currency Sync Cron Job stopped.");
  }
};

module.exports = {
  startCurrencyCron,
  stopCurrencyCron,
  CRON_SCHEDULE,
};
