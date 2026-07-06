import { google } from "googleapis";
import { config, hasBigoEmailConfig } from "../config.js";
import { listAdAccounts } from "./adAccountService.js";
import {
  BIGO_EMAIL_FROM,
  getSpendDateFromEmailReceivedAt,
  isBigoSpendEmail,
  matchBigoRowToAdAccount,
  parseBigoSpendEmail,
} from "./bigoEmailParser.js";
import { upsertAdSpend } from "./campaignSpendService.js";

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function extractBodies(payload) {
  let html = "";
  let text = "";

  function walk(part) {
    if (!part) return;
    const mimeType = part.mimeType || "";
    if (part.body?.data) {
      const decoded = decodeBase64Url(part.body.data);
      if (mimeType === "text/html") html += decoded;
      if (mimeType === "text/plain") text += decoded;
    }
    for (const child of part.parts || []) walk(child);
  }

  walk(payload);
  return { html, text };
}

function getHeader(headers = [], name) {
  const header = headers.find((item) => item.name?.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

function createGmailClient() {
  const oauth2 = new google.auth.OAuth2(config.bigoEmailClientId, config.bigoEmailClientSecret);
  oauth2.setCredentials({ refresh_token: config.bigoEmailRefreshToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export async function fetchRecentBigoEmails({ maxResults = 10, newerThanDays = 7 } = {}) {
  if (!hasBigoEmailConfig) {
    throw new Error("BIGO email sync is not configured. See docs/BIGO-EMAIL-SYNC.md");
  }

  const gmail = createGmailClient();
  const query = `from:${BIGO_EMAIL_FROM} newer_than:${newerThanDays}d`;
  const list = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  const messages = list.data.messages || [];
  const results = [];

  for (const item of messages) {
    const full = await gmail.users.messages.get({
      userId: "me",
      id: item.id,
      format: "full",
    });

    const headers = full.data.payload?.headers || [];
    const from = getHeader(headers, "From");
    const subject = getHeader(headers, "Subject");
    if (!isBigoSpendEmail({ from, subject })) continue;

    const receivedAt = new Date(Number(full.data.internalDate || Date.now()));
    const { html, text } = extractBodies(full.data.payload);
    const rows = parseBigoSpendEmail({ html, text });

    results.push({
      messageId: item.id,
      from,
      subject,
      receivedAt,
      spendDate: getSpendDateFromEmailReceivedAt(receivedAt),
      rows,
    });
  }

  return results;
}

export async function syncBigoSpendFromEmail({ maxResults = 10, newerThanDays = 7 } = {}) {
  const emails = await fetchRecentBigoEmails({ maxResults, newerThanDays });
  const adAccounts = await listAdAccounts();
  const written = [];
  const skipped = [];
  const errors = [];

  for (const email of emails) {
    for (const row of email.rows) {
      const account = matchBigoRowToAdAccount(row, adAccounts);
      if (!account) {
        skipped.push({
          spendDate: email.spendDate,
          accountName: row.accountName,
          reason: "No matching ad account",
        });
        continue;
      }

      try {
        const saved = await upsertAdSpend({
          date: email.spendDate,
          adAccountId: account.id,
          amount: row.spend,
          trafficSourceId: "bigo",
          source: "email",
        });
        written.push({
          spendDate: email.spendDate,
          adAccountId: account.id,
          amount: saved.amount,
          messageId: email.messageId,
        });
      } catch (error) {
        errors.push({
          spendDate: email.spendDate,
          accountName: row.accountName,
          message: error.message,
        });
      }
    }
  }

  return {
    emailsProcessed: emails.length,
    rowsWritten: written.length,
    written,
    skipped,
    errors,
  };
}
