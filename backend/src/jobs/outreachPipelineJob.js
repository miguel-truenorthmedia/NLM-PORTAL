import cron from "node-cron";
import { hasMongoConfig } from "../config.js";
import { advanceStaleProspects, warmOutreachCaches } from "../services/outreachService.js";

/** Daily 2:00 AM Eastern — advance Awaiting → No response → Follow-up. */
const CRON = process.env.OUTREACH_PIPELINE_CRON || "0 2 * * *";

let isRunning = false;

async function runOutreachPipelineAdvance() {
  if (isRunning) {
    console.warn("Outreach pipeline job already in progress, skipping scheduled run");
    return;
  }

  if (!hasMongoConfig) {
    console.warn("Outreach pipeline job skipped — MongoDB not configured");
    return;
  }

  isRunning = true;
  console.log("Starting scheduled outreach pipeline advance...");

  try {
    const result = await advanceStaleProspects();
    console.log(
      `Outreach pipeline advance finished: noResponse=${result.movedToNoResponse}, followUp=${result.movedToFollowUp}`
    );
  } catch (error) {
    console.error("Scheduled outreach pipeline job failed:", error);
  } finally {
    isRunning = false;
  }
}

export function startOutreachPipelineJob() {
  cron.schedule(
    CRON,
    () => {
      runOutreachPipelineAdvance();
    },
    { timezone: "America/New_York" }
  );

  console.log(
    `Outreach pipeline advance scheduled (${CRON}, America/New_York)` +
      (hasMongoConfig ? "" : " — waiting for MongoDB")
  );

  if (hasMongoConfig) {
    warmOutreachCaches()
      .then(() => console.log("Outreach caches warmed"))
      .catch((error) => console.warn("Outreach cache warm failed:", error.message));
  }
}

export { runOutreachPipelineAdvance as runOutreachPipelineNow };
