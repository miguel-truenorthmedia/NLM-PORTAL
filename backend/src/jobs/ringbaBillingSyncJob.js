import cron from "node-cron";
import { syncRingbaBillingExpenses } from "../services/pnlService.js";

let isRunning = false;

async function runScheduledRingbaBillingSync() {
  if (isRunning) {
    console.warn("Ringba billing sync already in progress, skipping scheduled run");
    return;
  }

  isRunning = true;
  console.log("Starting scheduled Ringba billing → P&L sync...");

  try {
    const result = await syncRingbaBillingExpenses({ monthsBack: 5 }, {
      name: "System",
      email: "system@nlm-portal",
    });
    console.log(
      `Ringba billing sync finished: fetched ${result.fetched}, imported/updated ${result.imported}, unchanged ${result.unchanged}, skipped ${result.skipped}`
    );
  } catch (error) {
    console.error("Scheduled Ringba billing sync failed:", error);
  } finally {
    isRunning = false;
  }
}

/** Every 3 days at 2:00 AM Eastern */
export function startRingbaBillingSyncJob() {
  cron.schedule(
    "0 2 */3 * *",
    () => {
      runScheduledRingbaBillingSync();
    },
    { timezone: "America/New_York" }
  );

  console.log("Ringba billing → P&L sync scheduled every 3 days at 2:00 AM ET");
}

export { runScheduledRingbaBillingSync as runRingbaBillingSyncNow };
