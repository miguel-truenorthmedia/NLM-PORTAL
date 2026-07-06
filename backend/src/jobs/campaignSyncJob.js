import cron from "node-cron";
import { syncCampaignData } from "../services/campaignSyncService.js";

let isRunning = false;

async function runScheduledCampaignSync() {
  if (isRunning) {
    console.warn("Campaign sync already in progress, skipping scheduled run");
    return;
  }

  isRunning = true;
  console.log("Starting scheduled campaign sync...");

  try {
    const result = await syncCampaignData({ daysBack: 60 });
    console.log(
      `Campaign sync finished: ${result.status} (${result.rowsWritten} rows, ${result.durationMs}ms)`
    );
    if (result.errors.length) {
      console.warn("Campaign sync errors:", result.errors);
    }
  } catch (error) {
    console.error("Scheduled campaign sync failed:", error);
  } finally {
    isRunning = false;
  }
}

export function startCampaignSyncJob() {
  cron.schedule(
    "0 2 * * *",
    () => {
      runScheduledCampaignSync();
    },
    { timezone: "America/New_York" }
  );

  console.log("Campaign sync scheduled for daily 2:00 AM ET");
}

export { runScheduledCampaignSync as runCampaignSyncNow };
