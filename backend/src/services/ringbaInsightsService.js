import { ringbaPost } from "./ringbaClient.js";

const VALUE_COLUMNS = [
  { column: "callCount", aggregateFunction: null },
  { column: "convertedCalls", aggregateFunction: null },
  { column: "conversionAmount", aggregateFunction: null },
  { column: "convertedPercent", aggregateFunction: null },
  { column: "payoutAmount", aggregateFunction: null },
];

function getDayWindow(date) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextDate = next.toISOString().slice(0, 10);
  return {
    reportStart: `${date}T04:00:00Z`,
    reportEnd: `${nextDate}T03:59:59Z`,
  };
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[$,%]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildPayload({ reportStart, reportEnd, campaignId, accountTag }) {
  const filters = [];
  if (campaignId) {
    filters.push({ column: "campaignId", value: campaignId, comparisonType: "EQUALS" });
  }
  if (accountTag) {
    filters.push({ column: "tag:User:account", value: accountTag, comparisonType: "EQUALS" });
  }

  return {
    reportStart,
    reportEnd,
    groupByColumns: [{ column: "tag:User:account", displayName: "User:account" }],
    valueColumns: VALUE_COLUMNS,
    orderByColumns: [{ column: "callCount", direction: "desc" }],
    formatTimespans: true,
    formatPercentages: true,
    generateRollups: true,
    maxResultsPerGroup: 1000,
    filters,
    formatTimeZone: "America/New_York",
  };
}

function extractRollupRecord(records = []) {
  const rollup = [...records].reverse().find((record) => !record["tag:User:account"]);
  if (!rollup) return null;
  return {
    calls: parseNumber(rollup.callCount),
    convertedCalls: parseNumber(rollup.convertedCalls),
    revenue: parseNumber(rollup.conversionAmount),
    convertedPercent: parseNumber(rollup.convertedPercent),
    payoutAmount: parseNumber(rollup.payoutAmount),
  };
}

function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export async function fetchInsightsRollup({ startDate, endDate, campaignId, accountTag }) {
  const window = {
    reportStart: `${startDate}T04:00:00Z`,
    reportEnd: `${endDate}T04:00:00Z`,
  };
  const nextEnd = new Date(`${endDate}T00:00:00Z`);
  nextEnd.setUTCDate(nextEnd.getUTCDate() + 1);
  window.reportEnd = `${nextEnd.toISOString().slice(0, 10)}T03:59:59Z`;

  const payload = buildPayload({ ...window, campaignId, accountTag });
  const data = await ringbaPost("/insights", payload);
  const records = data?.report?.records || [];
  return extractRollupRecord(records);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchDailyInsightsRollups({ startDate, endDate, campaignId, accountTag }) {
  const dates = getDateRange(startDate, endDate);
  const results = [];

  for (const date of dates) {
    const window = getDayWindow(date);
    const payload = buildPayload({ ...window, campaignId, accountTag });
    try {
      const data = await ringbaPost("/insights", payload);
      const rollup = extractRollupRecord(data?.report?.records || []);
      if (rollup) results.push({ date, ...rollup });
    } catch (error) {
      console.warn(`Ringba insights failed for ${date}:`, error.message);
    }
    await delay(200);
  }

  return results;
}
