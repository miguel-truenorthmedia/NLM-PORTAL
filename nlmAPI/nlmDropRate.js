/**
 * nlmDropRate — campaign drop-rate monitor (clock-aligned 30-minute windows).
 *
 * Drop rate = (-no value- incoming) / (campaign total incoming)
 * Slack alert only when total incoming >= MIN_TOTAL_CALLS (default 5).
 *
 * Schedule: every 30 min from 9:30 AM through 5:00 PM America/New_York
 * (see schedules.config.js). Each run evaluates the just-completed half hour:
 *   10:30 → 10:00–10:30 ET · 11:00 → 10:30–11:00 ET · … · 17:00 → 16:30–17:00 ET
 */
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const BASE_URL = "https://api.ringba.com/v2";
const RINGBA_ACCOUNT_ID = process.env.RINGBA_ACCOUNT_ID;
const API_TOKEN = process.env.RINGBA_API_TOKEN;
const USERNAME = process.env.RINGBA_USERNAME;
const PASSWORD = process.env.RINGBA_PASSWORD;

const SLACK_WEBHOOK_URL =
  process.env.SLACK_DROP_RATE_WEBHOOK_URL ||
  process.env.SLACK_RINGBA_ALERT_WEBHOOK_URL ||
  "";

const WINDOW_MINUTES = Number(process.env.DROP_RATE_WINDOW_MINUTES || 30);
const MIN_TOTAL_CALLS = Number(process.env.DROP_RATE_MIN_TOTAL_CALLS || 5);
const DRY_RUN =
  process.argv.includes("--dry-run") ||
  String(process.env.DROP_RATE_DRY_RUN || "").toLowerCase() === "true";
/** When true, skip the 9:30–5:00 ET window gate (for manual tests). */
const FORCE = process.argv.includes("--force");

const NO_VALUE_TARGETS = new Set(["-no value-", "no value", "(no value)", ""]);

async function getAuthToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", USERNAME);
  params.append("password", PASSWORD);
  const response = await axios.post(`${BASE_URL}/token`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
  });
  return response.data?.access_token ?? null;
}

async function getAuthorizationToken() {
  if (API_TOKEN) return API_TOKEN;
  if (USERNAME && PASSWORD) return getAuthToken();
  return null;
}

function ringbaAuthHeaders(token) {
  return {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Eastern wall-clock parts for `date`. */
function getEasternParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const values = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  // hour12:false can still yield "24" for midnight in some engines
  let hour = Number(values.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour,
    minute: Number(values.minute),
  };
}

/**
 * Active run window: 9:30 AM through 5:00 PM ET inclusive
 * (allows 17:00, blocks 9:00 and 17:30+).
 */
export function isWithinDropRateWindow(date = new Date()) {
  const { hour, minute } = getEasternParts(date);
  const mins = hour * 60 + minute;
  return mins >= 9 * 60 + 30 && mins <= 17 * 60;
}

/** ET offset minutes at `utcDate` (e.g. -240 for EDT). */
function getEtOffsetMinutes(utcDate) {
  const tzName =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      timeZoneName: "shortOffset",
      hour: "2-digit",
    })
      .formatToParts(utcDate)
      .find((p) => p.type === "timeZoneName")?.value || "GMT-5";
  const match = tzName.match(/GMT([+-]\d+)(?::(\d+))?/i);
  if (!match) return -5 * 60;
  const hours = Number(match[1]);
  const mins = Number(match[2] || 0);
  return hours * 60 + Math.sign(hours || 1) * mins;
}

/** Convert an America/New_York wall time to a UTC Date. */
function etWallToUtc({ year, month, day, hour, minute }) {
  const asUtcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const offsetMinutes = getEtOffsetMinutes(asUtcGuess);
  return new Date(asUtcGuess.getTime() - offsetMinutes * 60 * 1000);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Just-completed clock-aligned half hour in ET.
 * Trigger 10:30 → 10:00–10:30 · trigger 11:00 → 10:30–11:00.
 */
export function previousHalfHourWindowEt(now = new Date()) {
  const parts = getEasternParts(now);
  const endMinute = parts.minute < 30 ? 0 : 30;
  const endHour = parts.hour;

  let startMinute = endMinute === 0 ? 30 : 0;
  let startHour = endMinute === 0 ? endHour - 1 : endHour;
  let startDay = parts.day;
  let startMonth = parts.month;
  let startYear = parts.year;

  if (startHour < 0) {
    const noonUtc = etWallToUtc({
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: 12,
      minute: 0,
    });
    const prevNoon = new Date(noonUtc.getTime() - 24 * 60 * 60 * 1000);
    const prev = getEasternParts(prevNoon);
    startYear = prev.year;
    startMonth = prev.month;
    startDay = prev.day;
    startHour = 23;
    startMinute = 30;
  }

  const startUtc = etWallToUtc({
    year: startYear,
    month: startMonth,
    day: startDay,
    hour: startHour,
    minute: startMinute,
  });
  const endUtc = etWallToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: endHour,
    minute: endMinute,
  });

  const label = `${pad2(startHour)}:${pad2(startMinute)}–${pad2(endHour)}:${pad2(endMinute)} ET`;

  return {
    reportStart: startUtc.toISOString(),
    reportEnd: endUtc.toISOString(),
    label,
    startHour,
    startMinute,
    endHour,
    endMinute,
  };
}

function displayCampaignName(name = "") {
  return String(name)
    .replace(/^NLM\s*-\s*/i, "")
    .trim() || "Unknown campaign";
}

function isNoValueTarget(name) {
  const n = String(name ?? "").trim().toLowerCase();
  return NO_VALUE_TARGETS.has(n) || n === "-no value-";
}

/**
 * @returns {Promise<Map<string, { campaignName: string, total: number, noValue: number }>>}
 */
async function fetchCampaignTargetCounts(token, reportStart, reportEnd) {
  const response = await axios.post(
    `${BASE_URL}/${RINGBA_ACCOUNT_ID}/insights`,
    {
      reportStart,
      reportEnd,
      groupByColumns: [{ column: "campaignName" }, { column: "targetName" }],
      valueColumns: [{ column: "callCount" }],
      formatTimeZone: "America/New_York",
    },
    { headers: ringbaAuthHeaders(token), timeout: 60_000 }
  );

  const records = response.data?.report?.records || [];
  const byCampaign = new Map();

  for (const row of records) {
    const campaignName = String(row.campaignName || "").trim() || "(unknown)";
    const callCount = Number(row.callCount) || 0;
    if (!byCampaign.has(campaignName)) {
      byCampaign.set(campaignName, { campaignName, total: 0, noValue: 0 });
    }
    const agg = byCampaign.get(campaignName);
    agg.total += callCount;
    if (isNoValueTarget(row.targetName)) {
      agg.noValue += callCount;
    }
  }

  return byCampaign;
}

function formatDropRatePct(noValue, total) {
  if (!total) return "0.00";
  return ((noValue / total) * 100).toFixed(2);
}

function buildSlackText(campaignDisplayName, dropRatePct, windowLabel) {
  return [
    `*Campaign Drop Rate*`,
    `• ${campaignDisplayName} has a ${dropRatePct}% drop rate (${windowLabel})`,
  ].join("\n");
}

async function postSlack(text) {
  if (!SLACK_WEBHOOK_URL) {
    return { skipped: true, reason: "webhook_not_configured" };
  }
  if (DRY_RUN) {
    console.log("[dry-run] Would Slack:\n" + text);
    return { skipped: true, reason: "dry_run" };
  }
  await axios.post(
    SLACK_WEBHOOK_URL,
    { text },
    { headers: { "Content-Type": "application/json" }, timeout: 15_000 }
  );
  return { skipped: false };
}

export async function runDropRateCheck({ force = FORCE, now = new Date() } = {}) {
  if (!force && !isWithinDropRateWindow(now)) {
    const et = getEasternParts(now);
    console.log(
      `[nlmDropRate] Outside 9:30am–5:00pm ET window (${String(et.hour).padStart(2, "0")}:${String(et.minute).padStart(2, "0")} ET) — skipping`
    );
    return { skipped: true, reason: "outside_window" };
  }

  if (!RINGBA_ACCOUNT_ID) {
    throw new Error("Missing RINGBA_ACCOUNT_ID");
  }

  const token = await getAuthorizationToken();
  if (!token) {
    throw new Error("Missing Ringba token (RINGBA_API_TOKEN or username/password)");
  }

  const window = previousHalfHourWindowEt(now);
  const { reportStart, reportEnd, label } = window;
  console.log(
    `[nlmDropRate] Window ${reportStart} → ${reportEnd} (${label}, ${WINDOW_MINUTES}m aligned)`
  );

  const byCampaign = await fetchCampaignTargetCounts(token, reportStart, reportEnd);
  const results = [];

  if (byCampaign.size === 0) {
    console.log("[nlmDropRate] No campaign call volume in window.");
    return { skipped: false, window, alerts: [], results };
  }

  for (const agg of byCampaign.values()) {
    const dropRatePct = formatDropRatePct(agg.noValue, agg.total);
    const displayName = displayCampaignName(agg.campaignName);
    const row = {
      campaignName: agg.campaignName,
      displayName,
      total: agg.total,
      noValue: agg.noValue,
      dropRatePct,
      windowLabel: label,
      alerted: false,
      skipReason: null,
    };

    if (agg.total < MIN_TOTAL_CALLS) {
      row.skipReason = `total_below_min (${agg.total} < ${MIN_TOTAL_CALLS})`;
      console.log(
        `[nlmDropRate] ${displayName}: ${agg.noValue}/${agg.total} = ${dropRatePct}% — no alert (${row.skipReason})`
      );
      results.push(row);
      continue;
    }

    const text = buildSlackText(displayName, dropRatePct, label);
    const slack = await postSlack(text);
    row.alerted = !slack.skipped;
    row.skipReason = slack.skipped ? slack.reason : null;
    console.log(
      `[nlmDropRate] ${displayName}: ${agg.noValue}/${agg.total} = ${dropRatePct}%` +
        (row.alerted ? " — alert sent" : ` — slack skipped (${row.skipReason})`)
    );
    results.push(row);
  }

  return {
    skipped: false,
    window,
    alerts: results.filter((r) => r.alerted),
    results,
  };
}

async function main() {
  try {
    const summary = await runDropRateCheck();
    console.log("[nlmDropRate] Done", JSON.stringify(summary));
    process.exit(0);
  } catch (error) {
    console.error("[nlmDropRate] Failed:", error.response?.data || error.message || error);
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main();
}
