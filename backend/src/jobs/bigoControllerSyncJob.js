import cron from "node-cron";
import { hasBigoAdsConfig } from "../services/bigoClient.js";
import { syncControllerLive } from "../services/bigoCampaignService.js";

let isRunning = false;

async function runBigoControllerSync() {
  if (!hasBigoAdsConfig()) {
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
  // Every 1 minute — light at current tracked scale (1 advertiser / ~17 adsets)
  cron.schedule("* * * * *", () => {
    runBigoControllerSync();
  });

  console.log("BIGO controller sync scheduled every 1 minute");

  // Seed snapshot shortly after boot so the page has data without a manual click
  setTimeout(() => {
    runBigoControllerSync();
  }, 8_000);
}

export { runBigoControllerSync as runBigoControllerSyncNow };
