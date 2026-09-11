import { hasQuickBooksConfig, hasSlackInvoiceWebhook } from "../config.js";
import { fetchInvoiceAlertBuckets } from "./quickbooksInvoiceService.js";
import { postSlackInvoiceAlert } from "./slackService.js";

function formatMoney(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(Number(amount) || 0);
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
}

function formatInvoiceLine(invoice) {
  return `• #${invoice.docNumber} — ${invoice.customerName} — ${formatMoney(
    invoice.balance,
    invoice.currency
  )} (due ${invoice.dueDate})`;
}

function buildSlackPayload({ asOfDate, tomorrowDate, overdue, dueTomorrow }) {
  const sections = [];

  if (overdue.length) {
    sections.push(
      `*Overdue invoices* (${overdue.length}) — as of ${asOfDate} ET\n${overdue
        .map(formatInvoiceLine)
        .join("\n")}`
    );
  }

  if (dueTomorrow.length) {
    sections.push(
      `*Due tomorrow* (${dueTomorrow.length}) — ${tomorrowDate} ET\n${dueTomorrow
        .map(formatInvoiceLine)
        .join("\n")}`
    );
  }

  const text =
    sections.length > 0
      ? `*QBO invoice alert*\n\n${sections.join("\n\n")}`
      : `*QBO invoice alert*\nNo overdue invoices and nothing due tomorrow (${asOfDate} ET).`;

  return { text };
}

/**
 * Pull open invoices from QuickBooks and Slack-alert overdue + due-tomorrow.
 * @param {{ dryRun?: boolean, notifyWhenClear?: boolean }} options
 */
export async function runInvoiceDueAlerts({ dryRun = false, notifyWhenClear = false } = {}) {
  if (!hasQuickBooksConfig) {
    throw new Error(
      "QuickBooks is not configured. Set QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REFRESH_TOKEN, and QBO_REALM_ID."
    );
  }

  const startedAt = Date.now();
  const buckets = await fetchInvoiceAlertBuckets();
  const { overdue, dueTomorrow, asOfDate, tomorrowDate } = buckets;
  const hasAlerts = overdue.length > 0 || dueTomorrow.length > 0;
  const payload = buildSlackPayload(buckets);

  let slack = { skipped: true, reason: "no_alerts" };

  if (dryRun) {
    slack = { skipped: true, reason: "dry_run", payload };
  } else if (!hasSlackInvoiceWebhook) {
    slack = { skipped: true, reason: "slack_not_configured", payload };
  } else if (hasAlerts || notifyWhenClear) {
    const result = await postSlackInvoiceAlert(payload);
    slack = { skipped: false, ...result };
  }

  return {
    status: "success",
    asOfDate,
    tomorrowDate,
    overdueCount: overdue.length,
    dueTomorrowCount: dueTomorrow.length,
    overdue,
    dueTomorrow,
    slack,
    durationMs: Date.now() - startedAt,
  };
}
