import cron from "node-cron";
import { syncReconciliationHistory } from "../services/reconciliationSyncService.js";

/** Keep recent weeks fresh for monthly invoicing. Older weeks stay in Mongo forever. */
const WEEKS_TO_REFRESH = 8;

let isRunning = false;

async function runScheduledSync() {
  if (isRunning) {
    console.warn("Reconciliation sync already in progress, skipping scheduled run");
    return;
  }

  isRunning = true;
  console.log(`Starting scheduled reconciliation sync (last ${WEEKS_TO_REFRESH} weeks, no deletes)...`);

  try {
    const result = await syncReconciliationHistory(WEEKS_TO_REFRESH);
    console.log(
      `Reconciliation sync finished: ${result.status} (${result.weekCount} weeks, ${result.snapshotsWritten} snapshots)`
    );
    for (const week of result.weeks) {
      console.log(
        `  ${week.startDate} → ${week.endDate}: ${week.status} (${week.snapshotsWritten} rows${
          week.errors ? `, ${week.errors} errors` : ""
        })`
      );
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

  console.log(
    `Reconciliation sync scheduled for Mondays at 1:00 AM ET (refresh last ${WEEKS_TO_REFRESH} weeks; history retained)`
  );
}

export { runScheduledSync as runReconciliationSyncNow };
