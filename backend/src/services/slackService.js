import axios from "axios";
import { config, hasSlackInvoiceWebhook } from "../config.js";

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
