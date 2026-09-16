import cron from "node-cron";
import { syncYesterdayCampaignData } from "../services/campaignSyncService.js";

let isRunning = false;

async function runScheduledCampaignSync() {
  if (isRunning) {
    console.warn("Campaign sync already in progress, skipping scheduled run");
    return;
  }

  isRunning = true;
  console.log("Starting scheduled campaign sync (yesterday Ringba revenue + BIGO cost)...");

  try {
    const result = await syncYesterdayCampaignData();
    console.log(
      `Campaign sync finished: ${result.status} (${result.startDate} — ${result.rowsWritten} revenue rows, ${result.spendRowsWritten ?? 0} spend rows, ${result.durationMs}ms)`
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
    "0 1 * * *",
    () => {
      runScheduledCampaignSync();
    },
    { timezone: "America/New_York" }
  );

  console.log("Campaign sync scheduled for daily 1:00 AM ET (yesterday Ringba revenue + BIGO cost)");
}

export { runScheduledCampaignSync as runCampaignSyncNow };
