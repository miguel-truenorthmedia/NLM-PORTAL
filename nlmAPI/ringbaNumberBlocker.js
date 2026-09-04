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

/** Block inbound numbers that call this many times (or more) in the current ET day. */
const CALL_THRESHOLD = Number(process.env.NUMBER_BLOCKER_THRESHOLD || 3);
const PAGE_SIZE = 200;
const MAX_ROWS = 50_000;

const CALLLOGS_VALUE_COLUMNS = [
  { column: "campaignName" },
  { column: "inboundCallId" },
  { column: "callDt" },
  { column: "inboundPhoneNumber" },
  { column: "wasBlocked" },
  { column: "blockReason" },
];

if (!RINGBA_ACCOUNT_ID) {
  console.warn("⚠️ RINGBA_ACCOUNT_ID is not set.");
}
if (!API_TOKEN && (!USERNAME || !PASSWORD)) {
  console.warn("⚠️ Set RINGBA_API_TOKEN or RINGBA_USERNAME/RINGBA_PASSWORD.");
}

/**
 * Current calendar day in Eastern time, as UTC ISO strings.
 * Example: run at any time on 9/3 ET => midnight ET → 23:59:59.999 ET that day.
 */
function getCurrentEasternDayWindowUTC() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }

  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  const eastNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const utcNow = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzOffsetMs = utcNow.getTime() - eastNow.getTime();

  const startEastern = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const endEastern = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  return {
    reportStart: new Date(startEastern.getTime() + tzOffsetMs).toISOString(),
    reportEnd: new Date(endEastern.getTime() + tzOffsetMs).toISOString(),
  };
}

function buildCalllogsBody(reportStart, reportEnd, offset, size) {
  return {
    reportStart,
    reportEnd,
    orderByColumns: [{ column: "callDt", direction: "desc" }],
    // No campaign exclusions for NLM — count all inbound numbers account-wide.
    filters: [],
    valueColumns: CALLLOGS_VALUE_COLUMNS,
    formatTimespans: true,
    formatPercentages: true,
    formatDateTime: true,
    formatTimeZone: "America/New_York",
    size,
    offset,
  };
}

function extractReportRecords(responseData) {
  if (Array.isArray(responseData) && responseData.length > 0) {
    return responseData[0]?.report?.records ?? [];
  }
  return responseData?.report?.records ?? [];
}

async function getAuthToken() {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("username", USERNAME);
    params.append("password", PASSWORD);

    const response = await axios.post(`${BASE_URL}/token`, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    });

    return response.data?.access_token ?? null;
  } catch (error) {
    console.error("Error getting token:", error.response?.data || error);
    return null;
  }
}

async function getAuthorizationToken() {
  if (API_TOKEN) return API_TOKEN;
  return getAuthToken();
}

function ringbaAuthHeaders(token) {
  return {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  };
}

async function postCalllogsPage(token, reportStart, reportEnd, offset, size) {
  const response = await axios.post(
    `${BASE_URL}/${RINGBA_ACCOUNT_ID}/calllogs`,
    buildCalllogsBody(reportStart, reportEnd, offset, size),
    {
      headers: ringbaAuthHeaders(token),
      timeout: 60_000,
    }
  );
  return extractReportRecords(response.data);
}

async function fetchDailyCalllogs(token, options = {}) {
  const pageSize = options.pageSize ?? PAGE_SIZE;
  const maxRows = options.maxRows ?? MAX_ROWS;
  const { reportStart, reportEnd } = getCurrentEasternDayWindowUTC();

  const records = [];
  let offset = 0;

  while (records.length < maxRows) {
    const page = await postCalllogsPage(token, reportStart, reportEnd, offset, pageSize);
    if (!Array.isArray(page) || page.length === 0) break;

    for (const row of page) {
      records.push(row);
      if (records.length >= maxRows) break;
    }

    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return { reportStart, reportEnd, records };
}

function normalizeE164(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function countInboundPhoneNumbers(records) {
  const counts = new Map();
  for (const row of records) {
    const phone = normalizeE164(row?.inboundPhoneNumber);
    if (!phone) continue;
    counts.set(phone, (counts.get(phone) ?? 0) + 1);
  }
  return counts;
}

function getBlockCandidates(counts) {
  return [...counts.entries()]
    .filter(([, count]) => count >= CALL_THRESHOLD)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

async function fetchBlockedNumbers(token) {
  let response;
  try {
    response = await axios.get(`${BASE_URL}/${RINGBA_ACCOUNT_ID}/blockedNumbers`, {
      headers: ringbaAuthHeaders(token),
      timeout: 20_000,
    });
  } catch (error) {
    console.warn("⚠️ Could not fetch blockedNumbers list; continuing without pre-check.");
    console.warn("   reason:", error.response?.data || error.message || error);
    return new Set();
  }

  const records = Array.isArray(response.data)
    ? response.data
    : (response.data?.records ??
      response.data?.report?.records ??
      response.data?.data ??
      []);

  const blockedSet = new Set();
  for (const row of records) {
    const phone =
      normalizeE164(row?.phone_number) ??
      normalizeE164(row?.phoneNumber) ??
      normalizeE164(row?.e164Number) ??
      normalizeE164(row?.number);
    if (phone) blockedSet.add(phone);
  }
  return blockedSet;
}

async function blockPhoneNumber(token, phoneNumber) {
  const response = await axios.post(
    `${BASE_URL}/${RINGBA_ACCOUNT_ID}/blockedNumbers`,
    { phoneNumber },
    {
      headers: ringbaAuthHeaders(token),
      timeout: 60_000,
    }
  );
  return response.data;
}

function isAlreadyBlockedError(error) {
  const status = error?.response?.status;
  if (status === 409) return true;

  const payload = error?.response?.data;
  const message = String(payload?.message ?? "").toLowerCase();
  const modelState = JSON.stringify(payload?.modelState ?? {}).toLowerCase();

  return (
    message.includes("already") ||
    message.includes("exists") ||
    modelState.includes("already") ||
    modelState.includes("exists")
  );
}

async function run() {
  // Allow runBlockerDry.js / imports to force dry-run before calling run()
  const dryRun =
    String(process.env.NUMBER_BLOCKER_DRY_RUN || "").toLowerCase() === "true";

  const token = await getAuthorizationToken();
  if (!token) {
    console.error("❌ ringbaNumberBlocker: missing Ringba token. Exiting.");
    return;
  }
  if (!RINGBA_ACCOUNT_ID) {
    console.error("❌ ringbaNumberBlocker: missing RINGBA_ACCOUNT_ID. Exiting.");
    return;
  }

  const { reportStart, reportEnd, records } = await fetchDailyCalllogs(token);
  const counts = countInboundPhoneNumbers(records);
  const blockCandidates = getBlockCandidates(counts);
  const alreadyBlocked = await fetchBlockedNumbers(token);

  const blocked = [];
  const skippedAlreadyBlocked = [];
  const failed = [];

  for (const [phone, callCount] of blockCandidates) {
    if (alreadyBlocked.has(phone)) {
      skippedAlreadyBlocked.push({ phone, callCount });
      continue;
    }

    try {
      if (!dryRun) {
        await blockPhoneNumber(token, phone);
      }
      blocked.push({ phone, callCount });
    } catch (error) {
      if (isAlreadyBlockedError(error)) {
        skippedAlreadyBlocked.push({ phone, callCount });
        continue;
      }
      failed.push({
        phone,
        callCount,
        error: error.response?.data || error.message || String(error),
      });
    }
  }

  console.log("ringbaNumberBlocker — report window (current ET day):");
  console.log(" ", reportStart, "→", reportEnd);
  console.log("calllogs rows fetched:", records.length);
  console.log("unique inboundPhoneNumber count:", counts.size);
  console.log(`candidates with calls >= ${CALL_THRESHOLD}:`, blockCandidates.length);
  console.log("blocked this run:", blocked.length);
  if (blocked.length) {
    for (const row of blocked) {
      console.log(`  block ${row.phone} (${row.callCount} calls today)`);
    }
  }
  console.log("already blocked (skipped):", skippedAlreadyBlocked.length);
  console.log("block failures:", failed.length);
  if (failed.length) {
    for (const row of failed) {
      console.log("  fail", row.phone, row.error);
    }
  }
  if (dryRun) {
    console.log("dry-run mode: no block API calls were sent.");
  }

  if (records.length >= MAX_ROWS) {
    console.warn(
      `⚠️ Hit MAX_ROWS (${MAX_ROWS}); some rows may be missing. Increase cap if needed.`
    );
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  run().catch((err) => {
    console.error("❌ ringbaNumberBlocker failed:", err.response?.data || err);
    process.exit(1);
  });
}

export {
  BASE_URL,
  RINGBA_ACCOUNT_ID,
  CALL_THRESHOLD,
  buildCalllogsBody,
  countInboundPhoneNumbers,
  fetchBlockedNumbers,
  fetchDailyCalllogs,
  getAuthorizationToken,
  getAuthToken,
  getBlockCandidates,
  getCurrentEasternDayWindowUTC,
  ringbaAuthHeaders,
  run,
};
