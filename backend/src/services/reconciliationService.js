import { ringbaPost } from "./ringbaClient.js";
import { hasRingbaConfig } from "../config.js";
import { listCampaigns } from "./ringbaCampaignService.js";
import { buildReportWindow, getLastWeekRange } from "../utils/dateRange.js";

const SUMMARY_VALUE_COLUMNS = [
  { column: "callCount", aggregateFunction: null },
  { column: "liveCallCount", aggregateFunction: null },
  { column: "completedCalls", aggregateFunction: null },
  { column: "connectedCallCount", aggregateFunction: null },
  { column: "payoutCount", aggregateFunction: null },
  { column: "convertedCalls", aggregateFunction: null },
  { column: "earningsPerCallGross", aggregateFunction: null },
  { column: "conversionAmount", aggregateFunction: null },
  { column: "payoutAmount", aggregateFunction: null },
  { column: "profitGross", aggregateFunction: null },
  { column: "convertedPercent", aggregateFunction: null },
];

const CALLLOG_COLUMNS = [
  { column: "campaignName" },
  { column: "publisherName" },
  { column: "buyer" },
  { column: "targetName" },
  { column: "callDt" },
  { column: "inboundPhoneNumber" },
  { column: "number" },
  { column: "callLengthInSeconds" },
  { column: "isDuplicate" },
  { column: "conversionAmount" },
  { column: "payoutAmount" },
  { column: "hasConverted" },
];

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[$,%]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Number(value.toFixed(2));
}

function campaignFilter(campaignName) {
  return {
    anyConditionToMatch: [
      { column: "campaignName", value: campaignName, isNegativeMatch: false, comparisonType: "EQUALS" },
    ],
  };
}

function buyerFilter(buyerName) {
  return {
    anyConditionToMatch: [
      { column: "buyer", value: buyerName, isNegativeMatch: false, comparisonType: "EQUALS" },
    ],
  };
}

function isValidBuyerName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed && trimmed !== "-no value-";
}

function formatCallDt(value) {
  if (!value) return "";
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function mapSummaryRecord(record, campaignName, buyerName) {
  const calls = parseNumber(record.callCount);
  const convertedCalls = parseNumber(record.convertedCalls);
  const revenue = parseNumber(record.conversionAmount);
  const payout = parseNumber(record.payoutAmount);
  const profit = parseNumber(record.profitGross);
  const rpc = calls ? revenue / calls : 0;

  return {
    campaign: campaignName,
    buyer: buyerName || record.buyer || "All",
    calls,
    convertedCalls,
    rpc: round(rpc),
    revenue: round(revenue),
    payout: round(payout),
    profit: round(profit),
    convertedPercent: round(parseNumber(record.convertedPercent)),
  };
}

function mapCallRecord(record) {
  return {
    callDt: formatCallDt(record.callDt),
    callDtRaw: record.callDt,
    campaignName: record.campaignName || "",
    publisherName: record.publisherName || "",
    buyer: record.buyer || "",
    targetName: record.targetName || "",
    inboundPhoneNumber: record.inboundPhoneNumber || "",
    dialedNumber: record.number || "",
    callLength: formatDuration(record.callLengthInSeconds),
    callLengthInSeconds: Number(record.callLengthInSeconds) || 0,
    isDuplicate: Boolean(record.isDuplicate),
    conversionAmount: round(parseNumber(record.conversionAmount)),
    payoutAmount: round(parseNumber(record.payoutAmount)),
    hasConverted: Boolean(record.hasConverted),
  };
}

function hasConversion(record) {
  return parseNumber(record.conversionAmount) > 0 || Boolean(record.hasConverted);
}

async function postInsights({ startDate, endDate, groupBy, filters }) {
  const window = buildReportWindow(startDate, endDate);
  const payload = {
    ...window,
    groupByColumns: groupBy,
    valueColumns: SUMMARY_VALUE_COLUMNS,
    orderByColumns: [{ column: "callCount", direction: "desc" }],
    formatTimespans: true,
    formatPercentages: true,
    generateRollups: true,
    maxResultsPerGroup: 1000,
    filters,
    formatTimeZone: "America/New_York",
  };
  return ringbaPost("/insights", payload);
}

async function fetchAllCallLogs({ startDate, endDate, filters }) {
  const window = buildReportWindow(startDate, endDate);
  const basePayload = {
    ...window,
    orderByColumns: [{ column: "callDt", direction: "desc" }],
    filters,
    valueColumns: CALLLOG_COLUMNS,
  };

  const pageSize = 150;
  let offset = 0;
  const allRecords = [];

  while (true) {
    const data = await ringbaPost("/calllogs", {
      ...basePayload,
      offset,
      size: pageSize,
    });
    const records = data?.report?.records || [];
    allRecords.push(...records);

    if (records.length < pageSize) break;
    offset += pageSize;
    if (offset >= 10000) break;
  }

  return allRecords;
}

async function postCallLogs({ startDate, endDate, filters }) {
  const records = await fetchAllCallLogs({ startDate, endDate, filters });
  return { report: { records } };
}

export async function getBuyersForCampaign(campaignName, startDate, endDate) {
  if (!hasRingbaConfig || !campaignName) return [];

  const data = await postInsights({
    startDate,
    endDate,
    groupBy: [{ column: "buyer", displayName: "Buyer" }],
    filters: [campaignFilter(campaignName)],
  });

  const records = data?.report?.records || [];
  return records
    .filter((record) => isValidBuyerName(record.buyer))
    .map((record) => ({
      name: record.buyer,
      callCount: parseNumber(record.callCount),
    }))
    .sort((a, b) => b.callCount - a.callCount);
}

export async function getReconciliationData({ campaignName, buyerName, startDate, endDate }) {
  const filters = [campaignFilter(campaignName)];
  if (buyerName) filters.push(buyerFilter(buyerName));

  const [summaryData, callLogData] = await Promise.all([
    postInsights({
      startDate,
      endDate,
      groupBy: buyerName ? [{ column: "buyer", displayName: "Buyer" }] : [{ column: "buyer", displayName: "Buyer" }],
      filters,
    }),
    postCallLogs({ startDate, endDate, filters }),
  ]);

  const summaryRecords = summaryData?.report?.records || [];
  const rollupRecord = summaryRecords.find((r) => !r.buyer);
  const buyerRecord = buyerName ? summaryRecords.find((r) => r.buyer === buyerName) : null;
  const summarySource = buyerRecord || rollupRecord || {};
  const summary = mapSummaryRecord(summarySource, campaignName, buyerName);

  const allCalls = callLogData?.report?.records || [];
  const soldCalls = allCalls.filter(hasConversion).map(mapCallRecord);

  return {
    dateRange: { startDate, endDate },
    summary,
    calls: soldCalls,
    totalCallLogs: allCalls.length,
    soldCallCount: soldCalls.length,
  };
}

export async function getReconciliationFilters(startDate, endDate) {
  const campaigns = await listCampaigns();
  const defaultRange = getLastWeekRange();
  const range = {
    startDate: startDate || defaultRange.startDate,
    endDate: endDate || defaultRange.endDate,
  };

  const feCampaign =
    campaigns.find((c) => c.name === "NLM - Final Expense") ||
    campaigns.find((c) => c.offerType === "FE") ||
    campaigns[0];

  const buyers = feCampaign ? await getBuyersForCampaign(feCampaign.name, range.startDate, range.endDate) : [];

  return {
    campaigns,
    buyers,
    defaultRange,
    defaultCampaign: feCampaign || null,
    defaultBuyer: buyers.find((b) => b.name === "Elijay Marketing") || buyers[0] || null,
  };
}

export { getLastWeekRange };
