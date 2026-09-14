import axios from "axios";
import { config, hasSlackInvoiceWebhook, hasSlackOutreachWebhook } from "../config.js";

export function assertSlackInvoiceWebhookConfigured() {
  if (!hasSlackInvoiceWebhook) {
    throw new Error("Slack invoice webhook is not configured. Set SLACK_INVOICE_WEBHOOK_URL.");
  }
}

/**
 * Post a message to the accounting invoice Slack webhook.
 * @param {object} payload — Slack incoming-webhook JSON ({ text } and optional blocks)
 */
export async function postSlackInvoiceAlert(payload) {
  assertSlackInvoiceWebhookConfigured();

  const response = await axios.post(config.slackInvoiceWebhookUrl, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 15_000,
  });

  return { ok: true, status: response.status };
}

/**
 * Fire-and-forget outreach Slack notify.
 * No-ops if SLACK_OUTREACH_WEBHOOK_URL is unset; never throws to callers.
 */
export async function notifyOutreachSlack(text, extra = {}) {
  if (!hasSlackOutreachWebhook) {
    return { ok: false, skipped: true, reason: "webhook_not_configured" };
  }

  try {
    const payload = {
      text,
      ...extra,
    };
    const response = await axios.post(config.slackOutreachWebhookUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10_000,
    });
    return { ok: true, status: response.status };
  } catch (error) {
    console.warn("Outreach Slack notify failed:", error.message);
    return { ok: false, error: error.message };
  }
}
