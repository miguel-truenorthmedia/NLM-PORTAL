import { toLocalDateString } from "../utils/dateRange.js";

const BIGO_EMAIL_FROM = "noreply@service.bigoads.com";

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSpendValue(value) {
  const cleaned = String(value || "").replace(/[$,%]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseHtmlTableRows(html) {
  const rows = [];
  const trMatches = String(html || "").match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

  for (const tr of trMatches) {
    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) =>
      stripHtml(match[1])
    );
    if (cells.length < 6) continue;
    if (cells[0].toLowerCase() === "account name") continue;

    rows.push({
      accountName: cells[0],
      accountId: cells[1],
      campaign: cells[2],
      country: cells[3],
      timeCapped: cells[4],
      spend: parseSpendValue(cells[5]),
    });
  }

  return rows;
}

function parsePlainTextRows(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headerIndex = lines.findIndex((line) => line.toLowerCase().includes("account name"));
  if (headerIndex < 0) return [];

  const rows = [];
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const parts = lines[i].split(/\t+|\s{2,}/).map((part) => part.trim());
    if (parts.length < 6) continue;
    rows.push({
      accountName: parts[0],
      accountId: parts[1],
      campaign: parts[2],
      country: parts[3],
      timeCapped: parts[4],
      spend: parseSpendValue(parts[5]),
    });
  }

  return rows;
}

export function parseBigoSpendEmail({ html = "", text = "" }) {
  const htmlRows = parseHtmlTableRows(html);
  if (htmlRows.length) return htmlRows;
  return parsePlainTextRows(text);
}

/**
 * BIGO emails arrive the day after spend. Email on July 4 → spend date July 3 (America/New_York).
 */
export function getSpendDateFromEmailReceivedAt(receivedAt) {
  const date = receivedAt instanceof Date ? receivedAt : new Date(receivedAt);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const etNoon = new Date(year, month - 1, day, 12, 0, 0);
  etNoon.setDate(etNoon.getDate() - 1);
  return toLocalDateString(etNoon);
}

export function matchBigoRowToAdAccount(row, adAccounts = []) {
  const accountName = String(row.accountName || "").trim().toLowerCase();
  const accountId = String(row.accountId || "").trim();

  return (
    adAccounts.find((account) => {
      if (account.bigoAccountId && String(account.bigoAccountId) === accountId) return true;
      if (account.ringbaAccountTag && account.ringbaAccountTag.toLowerCase() === accountName) return true;
      if (account.displayName && account.displayName.toLowerCase() === String(row.campaign || "").toLowerCase()) {
        return true;
      }
      return false;
    }) || null
  );
}

export function isBigoSpendEmail({ from = "", subject = "" } = {}) {
  const fromLower = from.toLowerCase();
  return fromLower.includes(BIGO_EMAIL_FROM) || fromLower.includes("bigoads.com");
}

export { BIGO_EMAIL_FROM };
