import cron from "node-cron";
import { hasBigoAdsConfig } from "../services/bigoClient.js";
import { syncControllerLive } from "../services/bigoCampaignService.js";
import { isCampaignSyncRunning } from "./campaignSyncJob.js";

let isRunning = false;

async function runBigoControllerSync() {
  if (!hasBigoAdsConfig()) {
    return;
  }
  // Yield while 1 AM revenue/spend sync owns the ~1 QPS BIGO budget.
  if (isCampaignSyncRunning()) {
    console.warn("BIGO controller sync skipped — campaign spend sync in progress");
    return;
  }
  if (isRunning) {
    console.warn("BIGO controller sync already in progress, skipping");
    return;
  }

  isRunning = true;
  console.log("Starting BIGO controller sync (tracked campaigns → snapshot)...");
  try {
    const result = await syncControllerLive();
    console.log(
      `BIGO controller sync finished: ${result.adsets?.length || 0} ad sets, fetchedAt=${result.fetchedAt}`
    );
  } catch (error) {
    console.error("BIGO controller sync failed:", error.message || error);
  } finally {
    isRunning = false;
  }
}

export function startBigoControllerSyncJob() {
  // Every 3 minutes — leaves headroom under BIGO's ~1 QPS limit for manual toggles.
  cron.schedule("*/3 * * * *", () => {
    runBigoControllerSync();
  });

  console.log("BIGO controller sync scheduled every 3 minutes");

  // Seed snapshot shortly after boot so the page has data without a manual click
  setTimeout(() => {
    runBigoControllerSync();
  }, 8_000);
}

export { runBigoControllerSync as runBigoControllerSyncNow };
