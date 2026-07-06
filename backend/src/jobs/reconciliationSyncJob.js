import cron from "node-cron";
import { syncLastWeekReconciliation } from "../services/reconciliationSyncService.js";

let isRunning = false;

async function runScheduledSync() {
  if (isRunning) {
    console.warn("Reconciliation sync already in progress, skipping scheduled run");
    return;
  }

  isRunning = true;
  console.log("Starting scheduled reconciliation sync...");

  try {
    const result = await syncLastWeekReconciliation();
    console.log(
      `Reconciliation sync finished: ${result.status} (${result.snapshotsWritten} snapshots, ${result.durationMs}ms)`
    );
    if (result.errors.length) {
      console.warn("Reconciliation sync errors:", result.errors);
    }
  } catch (error) {
    console.error("Scheduled reconciliation sync failed:", error);
  } finally {
    isRunning = false;
  }
}

export function startReconciliationSyncJob() {
  cron.schedule(
    "0 1 * * 1",
    () => {
      runScheduledSync();
    },
    { timezone: "America/New_York" }
  );

  console.log("Reconciliation sync scheduled for Mondays at 1:00 AM ET");
}

export { runScheduledSync as runReconciliationSyncNow };
