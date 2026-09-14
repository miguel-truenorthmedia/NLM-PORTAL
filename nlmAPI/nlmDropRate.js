/**
 * nlmDropRate — campaign drop-rate monitor (last 30 minutes).
 *
 * Drop rate = (-no value- incoming) / (campaign total incoming)
 * Slack alert only when total incoming >= MIN_TOTAL_CALLS (default 20).
 *
 * Schedule: every 30 min, 9:00 AM – 6:00 PM America/New_York (see schedules.config.js)
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
const MIN_TOTAL_CALLS = Number(process.env.DROP_RATE_MIN_TOTAL_CALLS || 20);
const DRY_RUN =
  process.argv.includes("--dry-run") ||
  String(process.env.DROP_RATE_DRY_RUN || "").toLowerCase() === "true";
/** When true, skip the 9–6 ET window gate (for manual tests). */
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
 * Business window: 9:00 AM through 6:00 PM ET inclusive (allows 18:00, blocks 18:30+).
 */
export function isWithinDropRateWindow(date = new Date()) {
  const { hour, minute } = getEasternParts(date);
  const mins = hour * 60 + minute;
  return mins >= 9 * 60 && mins <= 18 * 60;
}

function lastWindowIso(minutes = WINDOW_MINUTES) {
  const end = Date.now();
  const start = end - minutes * 60 * 1000;
  return {
    reportStart: new Date(start).toISOString(),
    reportEnd: new Date(end).toISOString(),
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

function buildSlackText(campaignDisplayName, dropRatePct) {
  return [
    `*Campaign Drop Rate*`,
    `• ${campaignDisplayName} has a ${dropRatePct}% drop rate in the last ${WINDOW_MINUTES} minutes`,
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

export async function runDropRateCheck({ force = FORCE } = {}) {
  if (!force && !isWithinDropRateWindow()) {
    const et = getEasternParts();
    console.log(
      `[nlmDropRate] Outside 9am–6pm ET window (${String(et.hour).padStart(2, "0")}:${String(et.minute).padStart(2, "0")} ET) — skipping`
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

  const { reportStart, reportEnd } = lastWindowIso();
  console.log(`[nlmDropRate] Window ${reportStart} → ${reportEnd} (last ${WINDOW_MINUTES}m)`);

  const byCampaign = await fetchCampaignTargetCounts(token, reportStart, reportEnd);
  const results = [];

  if (byCampaign.size === 0) {
    console.log("[nlmDropRate] No campaign call volume in window.");
    return { skipped: false, alerts: [], results };
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

    const text = buildSlackText(displayName, dropRatePct);
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
