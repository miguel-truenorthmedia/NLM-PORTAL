import cron from "node-cron";
import {
  syncBigoSpendForDateRange,
  syncYesterdayCampaignData,
} from "../services/campaignSyncService.js";

let isRunning = false;

/** True while the 1 AM (or manual) campaign sync holds the BIGO API — controller should yield. */
export function isCampaignSyncRunning() {
  return isRunning;
}

async function retrySpendIfMissing(result) {
  const spendErrors = (result.errors || []).filter((e) =>
    String(e.message || "").includes("BIGO spend")
  );
  if ((result.spendRowsWritten ?? 0) > 0 || !spendErrors.length || !result.startDate) {
    return result;
  }

  // Controller sync often burns the 1 QPS budget at :00 — wait, then retry spend only.
  for (const delayMs of [90_000, 180_000, 300_000]) {
    console.warn(
      `Campaign spend missing for ${result.startDate}; retrying BIGO cost in ${Math.round(delayMs / 1000)}s...`
    );
    await new Promise((r) => setTimeout(r, delayMs));
    try {
      const spendSync = await syncBigoSpendForDateRange({
        startDate: result.startDate,
        endDate: result.endDate || result.startDate,
      });
      console.log(
        `Campaign spend retry: ${spendSync.rowsWritten} rows, errors=${spendSync.errors?.length || 0}`
      );
      if (spendSync.rowsWritten > 0) {
        return {
          ...result,
          spendRowsWritten: spendSync.rowsWritten,
          status: result.rowsWritten > 0 ? "success" : result.status,
          errors: (result.errors || []).filter((e) => !String(e.message || "").includes("BIGO spend")),
        };
      }
    } catch (error) {
      console.error("Campaign spend retry failed:", error.message || error);
    }
  }
  return result;
}

async function runScheduledCampaignSync() {
  if (isRunning) {
    console.warn("Campaign sync already in progress, skipping scheduled run");
    return;
  }

  isRunning = true;
  console.log("Starting scheduled campaign sync (yesterday Ringba revenue + BIGO cost)...");

  try {
    let result = await syncYesterdayCampaignData();
    result = await retrySpendIfMissing(result);
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

  // Safety net: if 1 AM spend still failed (rate limit), try again at 1:20 AM ET.
  cron.schedule(
    "20 1 * * *",
    async () => {
      if (isRunning) return;
      isRunning = true;
      try {
        const { getYesterdayDate } = await import("../utils/dateRange.js");
        const yesterday = getYesterdayDate(new Date());
        console.log(`Starting BIGO spend safety-net sync for ${yesterday}...`);
        const spendSync = await syncBigoSpendForDateRange({
          startDate: yesterday,
          endDate: yesterday,
        });
        console.log(
          `BIGO spend safety-net finished: ${spendSync.rowsWritten} rows, errors=${spendSync.errors?.length || 0}`
        );
        if (spendSync.errors?.length) {
          console.warn("BIGO spend safety-net errors:", spendSync.errors);
        }
      } catch (error) {
        console.error("BIGO spend safety-net failed:", error.message || error);
      } finally {
        isRunning = false;
      }
    },
    { timezone: "America/New_York" }
  );

  console.log(
    "Campaign sync scheduled for daily 1:00 AM ET (+ 1:20 AM spend safety-net)"
  );
}

export { runScheduledCampaignSync as runCampaignSyncNow };
