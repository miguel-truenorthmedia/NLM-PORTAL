import cron from "node-cron";
import { hasQuickBooksConfig } from "../config.js";
import { runInvoiceDueAlerts } from "../services/invoiceAlertService.js";

/** Daily 8:00 AM Eastern — overdue + due-tomorrow Slack alerts. */
const CRON = process.env.INVOICE_ALERT_CRON || "0 8 * * *";

let isRunning = false;

async function runScheduledInvoiceAlerts() {
  if (isRunning) {
    console.warn("Invoice alert job already in progress, skipping scheduled run");
    return;
  }

  if (!hasQuickBooksConfig) {
    console.warn("Invoice alert job skipped — QuickBooks env vars not set");
    return;
  }

  isRunning = true;
  console.log("Starting scheduled QBO invoice due alerts...");

  try {
    const result = await runInvoiceDueAlerts();
    console.log(
      `Invoice alerts finished: overdue=${result.overdueCount}, dueTomorrow=${result.dueTomorrowCount}, slack=${
        result.slack?.skipped ? `skipped(${result.slack.reason})` : "sent"
      } (${result.durationMs}ms)`
    );
  } catch (error) {
    console.error("Scheduled invoice alert job failed:", error);
  } finally {
    isRunning = false;
  }
}

export function startInvoiceAlertJob() {
  cron.schedule(
    CRON,
    () => {
      runScheduledInvoiceAlerts();
    },
    { timezone: "America/New_York" }
  );

  console.log(
    `Invoice due alerts scheduled (${CRON}, America/New_York)` +
      (hasQuickBooksConfig ? "" : " — waiting for QBO credentials")
  );
}

export { runScheduledInvoiceAlerts as runInvoiceAlertsNow };
