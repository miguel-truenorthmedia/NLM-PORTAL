import express from "express";
import { hasQuickBooksAppConfig, hasSlackInvoiceWebhook } from "../config.js";
import { isQuickBooksReady } from "../services/quickbooksClient.js";
import { runInvoiceDueAlerts } from "../services/invoiceAlertService.js";

const router = express.Router();

router.get("/status", async (_req, res) => {
  res.json({
    quickBooksAppConfigured: hasQuickBooksAppConfig,
    quickBooksReady: await isQuickBooksReady(),
    slackWebhookConfigured: hasSlackInvoiceWebhook,
    schedule: process.env.INVOICE_ALERT_CRON || "0 8 * * *",
    timezone: "America/New_York",
  });
});

/**
 * Manual run for testing.
 * Query: ?dryRun=true — fetch QBO only, do not post Slack
 * Query: ?notifyWhenClear=true — Slack even when nothing is due
 */
router.post("/run", async (req, res) => {
  if (!(await isQuickBooksReady())) {
    return res.status(400).json({
      error:
        "QuickBooks is not connected. Complete OAuth at /api/integrations/quickbooks/connect first.",
    });
  }

  try {
    const dryRun =
      req.query.dryRun === "true" ||
      req.body?.dryRun === true ||
      req.body?.dryRun === "true";
    const notifyWhenClear =
      req.query.notifyWhenClear === "true" ||
      req.body?.notifyWhenClear === true ||
      req.body?.notifyWhenClear === "true";

    const result = await runInvoiceDueAlerts({ dryRun, notifyWhenClear });
    return res.json(result);
  } catch (error) {
    console.error("Manual invoice alert run failed:", error.message);
    return res.status(500).json({
      error: error.message || "Failed to run invoice due alerts",
    });
  }
});

export default router;
