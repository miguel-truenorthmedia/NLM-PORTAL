import axios from "axios";
import { config, hasRingbaConfig } from "../config.js";

const MOCK_CALLS = [
  {
    date: "2026-05-07",
    campaign: "NLM FE EN",
    publisher: "Inbound Calls",
    adGroup: "AG006",
    calls: 1,
    connectedCalls: 1,
    paidCalls: 1,
    revenue: 88.25,
    totalDuration: 143,
  },
  {
    date: "2026-05-07",
    campaign: "NLM FE EN",
    publisher: "Inbound Calls",
    adGroup: "AG007",
    calls: 1,
    connectedCalls: 1,
    paidCalls: 0,
    revenue: 0,
    totalDuration: 92,
  },
  {
    date: "2026-05-07",
    campaign: "NLM FE EN",
    publisher: "Inbound Calls",
    adGroup: "AG007",
    calls: 1,
    connectedCalls: 1,
    paidCalls: 1,
    revenue: 33.21,
    totalDuration: 124,
  },
  {
    date: "2026-05-08",
    campaign: "NLM FE EN",
    publisher: "Inbound Calls",
    adGroup: "AG006",
    calls: 1,
    connectedCalls: 1,
    paidCalls: 1,
    revenue: 102.4,
    totalDuration: 200,
  },
  {
    date: "2026-05-08",
    campaign: "Unknown",
    publisher: "Unknown",
    adGroup: "Unknown",
    calls: 1,
    connectedCalls: 0,
    paidCalls: 0,
    revenue: 0,
    totalDuration: 25,
  },
];

const INSIGHTS_VALUE_COLUMNS = [
  { column: "callCount", aggregateFunction: null },
  { column: "connectedCallCount", aggregateFunction: null },
  { column: "payoutCount", aggregateFunction: null },
  { column: "payoutAmount", aggregateFunction: null },
  { column: "callLengthInSeconds", aggregateFunction: null },
];

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[$,%]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDurationToSeconds(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const parts = value.split(":").map((piece) => Number(piece));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return 0;
  const [hh, mm, ss] = parts;
  return hh * 3600 + mm * 60 + ss;
}

function getNewYorkDayWindow(date) {
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextDateString = nextDate.toISOString().slice(0, 10);
  return {
    reportStart: `${date}T04:00:00Z`,
    reportEnd: `${nextDateString}T03:59:59Z`,
  };
}

function inRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

function normalizeAdGroup(value) {
  if (!value || value === "-no value-") return "Unknown";
  return String(value).trim() || "Unknown";
}

function normalizeDimension(value) {
  if (!value || value === "-no value-") return "Unknown";
  return String(value).trim() || "Unknown";
}

function shouldIncludeTaggedAdGroup(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  if (!normalized) return false;
  if (normalized === "-no value-") return false;
  return true;
}

function buildInsightsPayload(date) {
  const { reportStart, reportEnd } = getNewYorkDayWindow(date);
  return {
    reportStart,
    reportEnd,
    groupByColumns: [{ column: "tag:User:bbg_ad_group_name", displayName: "User:bbg_ad_group_name" }],
    valueColumns: INSIGHTS_VALUE_COLUMNS,
    orderByColumns: [{ column: "callCount", direction: "desc" }],
    formatTimespans: true,
    formatPercentages: true,
    generateRollups: true,
    maxResultsPerGroup: 1000,
    filters: [],
    formatTimeZone: "America/New_York",
  };
}

async function fetchDayInsights(date) {
  const url = `https://api.ringba.com/v2/${config.ringbaAccountId}/insights`;
  let response;
  try {
    response = await axios.post(url, buildInsightsPayload(date), {
      headers: {
        Authorization: `Token ${config.ringbaToken}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 401) throw error;
    // Some Ringba setups still expect Bearer tokens.
    response = await axios.post(url, buildInsightsPayload(date), {
      headers: {
        Authorization: `Bearer ${config.ringbaToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  const records = Array.isArray(response.data?.report?.records) ? response.data.report.records : [];
  return records
    .filter((record) => shouldIncludeTaggedAdGroup(record["tag:User:bbg_ad_group_name"]))
    .map((record) => ({
      date,
      campaign: normalizeDimension(record.campaignName || record["tag:User:bbg_campaign_name"]),
      publisher: normalizeDimension(record.publisherName || record["tag:Publisher"]),
      adGroup: normalizeAdGroup(record["tag:User:bbg_ad_group_name"]),
      calls: parseNumber(record.callCount),
      connectedCalls: parseNumber(record.connectedCallCount),
      paidCalls: parseNumber(record.payoutCount),
      revenue: parseNumber(record.payoutAmount),
      totalDuration: parseDurationToSeconds(record.callLengthInSeconds),
    }));
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

async function fetchRingbaCalls(startDate, endDate) {
  const dates = getDateRange(startDate, endDate);
  const responses = await Promise.all(dates.map((date) => fetchDayInsights(date)));
  return responses.flat().filter((row) => inRange(row.date, startDate, endDate));
}

export async function getRingbaCalls(startDate, endDate) {
  if (!hasRingbaConfig) {
    return MOCK_CALLS.filter((row) => inRange(row.date, startDate, endDate));
  }

  try {
    return await fetchRingbaCalls(startDate, endDate);
  } catch (error) {
    console.warn("Ringba fetch failed, returning empty Ringba rows:", error.message);
    return [];
  }
}
