import { hasMongoConfig, hasRingbaConfig } from "../config.js";
import { BigoControllerSnapshot } from "../models/BigoControllerSnapshot.js";
import { BigoTrackedCampaign } from "../models/BigoTrackedCampaign.js";
import { bigoListAll, bigoPost, hasBigoAdsConfig } from "./bigoClient.js";
import { listAdAccounts } from "./adAccountService.js";
import { ringbaPost } from "./ringbaClient.js";

function requireMongo() {
  if (!hasMongoConfig) throw new Error("MongoDB is required for BIGO campaign tracking");
}

function requireBigo() {
  if (!hasBigoAdsConfig()) {
    throw new Error("BIGO Ads is not configured. Set BIGO_CLIENT_ID and BIGO_CLIENT_SECRET.");
  }
}

function actorFromUser(user) {
  if (!user) return { userId: "", name: "", email: "" };
  return {
    userId: String(user.id || user._id || ""),
    name: String(user.name || user.email || "Unknown").trim(),
    email: String(user.email || "").trim().toLowerCase(),
  };
}

function summarizeAccount(a) {
  return {
    id: String(a.id ?? a.advertiserId ?? ""),
    name: a.name || a.advertiserName || "",
    timezone: typeof a.timezone === "number" ? a.timezone : Number(a.timezone) || 0,
    currency: a.currency || "USD",
    status: a.status,
  };
}

function summarizeCampaign(c) {
  return {
    id: String(c.id ?? c.campaignId ?? ""),
    name: c.name || c.campaignName || "",
    status: c.status,
    calcStatus: c.calcStatus,
    calcSubStatus: c.calcSubStatus,
    budgetMode: c.budgetMode,
    budget: c.budget,
    createdAt: c.createTime || c.createdTime || c.ctime || null,
  };
}

function summarizeAdset(a) {
  const status = Number(a.status);
  /** Adset budget/bid config fields are already in currency units (not ×100 like report cost). */
  const budget = Number(a.budget);
  const secondBid = Number(a.secondBid);
  const bid = Number(a.bid);
  return {
    id: String(a.id ?? a.adsetId ?? ""),
    name: a.name || a.adsetName || "",
    campaignId: String(a.campaignId || ""),
    status,
    /** BIGO: 1 = enabled (running), 2 = suspended (paused) */
    paused: status === 2,
    calcStatus: a.calcStatus,
    calcSubStatus: a.calcSubStatus,
    budgetMode: a.budgetMode ?? null,
    budget: Number.isFinite(budget) ? budget : null,
    /** OCPC basic goal bid (phase-2). Prefer secondBid; fall back to bid. */
    basicGoalBid: Number.isFinite(secondBid) && secondBid > 0
      ? secondBid
      : Number.isFinite(bid) && bid > 0
        ? bid
        : Number.isFinite(secondBid)
          ? secondBid
          : null,
    createdAt: a.createTime || a.createdTime || a.ctime || null,
  };
}

function normalizeTracked(doc) {
  return {
    id: String(doc._id),
    advertiserId: doc.advertiserId,
    advertiserName: doc.advertiserName || "",
    timezone: doc.timezone ?? -5,
    currency: doc.currency || "USD",
    campaignId: doc.campaignId,
    campaignName: doc.campaignName || "",
    updatedAt: doc.updatedAt || null,
    createdAt: doc.createdAt || null,
  };
}

/** yyyy-MM-dd for a fixed UTC offset (e.g. -5 for Eastern standard-style offset from BIGO). */
export function dateStringForOffset(offsetHours, date = new Date()) {
  const shifted = new Date(date.getTime() + Number(offsetHours) * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** BIGO money fields are 1/100 of currency unit. */
export function fromBigoMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}

/** Cost per call — Cost / Ringba incoming. */
export function calcCpc(cost, incomingCalls) {
  const calls = Number(incomingCalls) || 0;
  const spend = Number(cost) || 0;
  if (calls <= 0) return null;
  return spend / calls;
}

/** Profit = revenue − cost. */
export function calcProfit(revenue, cost) {
  return (Number(revenue) || 0) - (Number(cost) || 0);
}

/** ROI % = (Profit ÷ Cost) × 100. Null when cost is 0. */
export function calcRoi(profit, cost) {
  const spend = Number(cost) || 0;
  if (spend <= 0) return null;
  return ((Number(profit) || 0) / spend) * 100;
}

function withPnl(row) {
  const cost = Number(row.cost) || 0;
  const revenue = Number(row.revenue) || 0;
  const profit = calcProfit(revenue, cost);
  const roi = calcRoi(profit, cost);
  return { ...row, profit, roi };
}

/** Map offerType / name hints → Ringba campaign display name. */
const RINGBA_CAMPAIGN_BY_OFFER = {
  FE: "NLM - Final Expense",
  ACA: "NLM - ACA",
  MEDICARE: "NLM - Medicare",
};

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[$,%]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function etDayWindow(dayYmd) {
  const next = new Date(`${dayYmd}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextDate = next.toISOString().slice(0, 10);
  return {
    reportStart: `${dayYmd}T04:00:00Z`,
    reportEnd: `${nextDate}T03:59:59Z`,
  };
}

/**
 * Resolve Ringba publisher + campaign filters for a BIGO advertiser.
 * Prefer adAccounts.json; fall back to parsing the BIGO account name
 * (e.g. "Franz NLM FE 1" → publisher Franz, offer FE → "NLM - Final Expense").
 */
export function resolveRingbaFilters({ linkedAccount, advertiserName } = {}) {
  const name = String(advertiserName || linkedAccount?.displayName || "").trim();

  let publisherName = String(linkedAccount?.publisherName || "").trim();
  if (!publisherName && name) {
    // First token before space / dash / underscore
    publisherName = name.split(/[\s\-_]+/).find(Boolean) || "";
  }

  let offerType = String(linkedAccount?.offerType || "").trim().toUpperCase();
  if (!offerType) {
    if (/\bFE\b|final\s*expense/i.test(name)) offerType = "FE";
    else if (/\bACA\b/i.test(name)) offerType = "ACA";
    else if (/medicare/i.test(name)) offerType = "MEDICARE";
  }

  const campaignName =
    String(linkedAccount?.ringbaCampaignName || "").trim() ||
    RINGBA_CAMPAIGN_BY_OFFER[offerType] ||
    "";

  return {
    publisherName,
    campaignName,
    offerType,
    ringbaCampaignId: String(linkedAccount?.campaignId || "").trim(),
    ringbaAccountTag: String(linkedAccount?.ringbaAccountTag || "").trim(),
  };
}

/**
 * Account-level Ringba rollup: filter by publisherName + campaignName (insights).
 * Matches Ringba UI filters: Publisher EQUALS Franz AND Campaign EQUALS NLM - Final Expense.
 */
async function fetchRingbaAccountInsights({ dayYmd, publisherName, campaignName }) {
  if (!hasRingbaConfig || !publisherName || !campaignName) {
    return { incomingCalls: 0, revenue: 0 };
  }

  const { reportStart, reportEnd } = etDayWindow(dayYmd);
  const payload = {
    reportStart,
    reportEnd,
    filters: [
      {
        column: "publisherName",
        value: publisherName,
        isNegativeMatch: false,
        comparisonType: "EQUALS",
      },
      {
        column: "campaignName",
        value: campaignName,
        isNegativeMatch: false,
        comparisonType: "EQUALS",
      },
    ],
    groupByColumns: [{ column: "publisherName", displayName: "Publisher" }],
    orderByColumns: [{ column: "callCount", direction: "desc" }],
    valueColumns: [
      { column: "callCount", aggregateFunction: null },
      { column: "liveCallCount", aggregateFunction: null },
      { column: "convertedCalls", aggregateFunction: null },
      { column: "conversionAmount", aggregateFunction: null },
      { column: "payoutAmount", aggregateFunction: null },
    ],
    formatPercentages: true,
    formatTimeZone: "America/New_York",
    formatTimespans: true,
    generateRollups: true,
    maxResultsPerGroup: 1000,
  };

  const data = await ringbaPost("/insights", payload);
  const records = data?.report?.records || [];

  // Prefer rollup row (no publisherName / empty); else sum matching publisher rows
  const rollup = [...records]
    .reverse()
    .find((r) => !r.publisherName || String(r.publisherName).trim() === "");
  if (rollup) {
    return {
      incomingCalls: parseNumber(rollup.callCount),
      revenue: parseNumber(rollup.conversionAmount),
    };
  }

  let incomingCalls = 0;
  let revenue = 0;
  for (const row of records) {
    if (String(row.publisherName || "").trim().toLowerCase() !== publisherName.toLowerCase()) {
      continue;
    }
    incomingCalls += parseNumber(row.callCount);
    revenue += parseNumber(row.conversionAmount);
  }
  return { incomingCalls, revenue };
}

/**
 * Campaign-level Ringba metrics grouped by tag:User:Campaign Name.
 * BIGO campaign names (e.g. "Franz - Low Bid") match this tag 1:1.
 */
async function fetchRingbaByCampaignTag({ dayYmd, publisherName, campaignName }) {
  if (!hasRingbaConfig) return new Map();

  const { reportStart, reportEnd } = etDayWindow(dayYmd);
  const filters = [];
  // Scope to the BIGO account's Ringba publisher + offer campaign when known
  if (publisherName) {
    filters.push({
      column: "publisherName",
      value: publisherName,
      isNegativeMatch: false,
      comparisonType: "EQUALS",
    });
  }
  if (campaignName) {
    filters.push({
      column: "campaignName",
      value: campaignName,
      isNegativeMatch: false,
      comparisonType: "EQUALS",
    });
  }

  const payload = {
    reportStart,
    reportEnd,
    filters,
    groupByColumns: [{ column: "tag:User:Campaign Name", displayName: "User:Campaign Name" }],
    orderByColumns: [{ column: "callCount", direction: "desc" }],
    valueColumns: [
      { column: "callCount", aggregateFunction: null },
      { column: "liveCallCount", aggregateFunction: null },
      { column: "convertedCalls", aggregateFunction: null },
      { column: "conversionAmount", aggregateFunction: null },
      { column: "payoutAmount", aggregateFunction: null },
    ],
    formatPercentages: true,
    formatTimeZone: "America/New_York",
    formatTimespans: true,
    generateRollups: true,
    maxResultsPerGroup: 1000,
  };

  const data = await ringbaPost("/insights", payload);
  const records = data?.report?.records || [];
  const byName = new Map();

  for (const row of records) {
    const raw = String(row["tag:User:Campaign Name"] ?? "").trim();
    if (!raw || raw === "-no value-") continue;
    const key = raw.toLowerCase();
    byName.set(key, {
      name: raw,
      incomingCalls: parseNumber(row.callCount),
      revenue: parseNumber(row.conversionAmount),
      payout: parseNumber(row.payoutAmount),
    });
  }

  return byName;
}

/**
 * Ad-group-level Ringba metrics grouped by tag:User:Ad group Name.
 * Matches BIGO ad set names (e.g. "B2-Copy1-1787662639").
 */
async function fetchRingbaByAdGroupTag({ dayYmd, publisherName, campaignName }) {
  if (!hasRingbaConfig) return new Map();

  const { reportStart, reportEnd } = etDayWindow(dayYmd);
  const filters = [];
  if (publisherName) {
    filters.push({
      column: "publisherName",
      value: publisherName,
      isNegativeMatch: false,
      comparisonType: "EQUALS",
    });
  }
  if (campaignName) {
    filters.push({
      column: "campaignName",
      value: campaignName,
      isNegativeMatch: false,
      comparisonType: "EQUALS",
    });
  }

  const payload = {
    reportStart,
    reportEnd,
    filters,
    groupByColumns: [{ column: "tag:User:Ad group Name", displayName: "User:Ad group Name" }],
    orderByColumns: [{ column: "callCount", direction: "desc" }],
    valueColumns: [
      { column: "callCount", aggregateFunction: null },
      { column: "liveCallCount", aggregateFunction: null },
      { column: "convertedCalls", aggregateFunction: null },
      { column: "conversionAmount", aggregateFunction: null },
      { column: "payoutAmount", aggregateFunction: null },
    ],
    formatPercentages: true,
    formatTimeZone: "America/New_York",
    formatTimespans: true,
    generateRollups: true,
    maxResultsPerGroup: 1000,
  };

  const data = await ringbaPost("/insights", payload);
  const records = data?.report?.records || [];
  const byName = new Map();

  for (const row of records) {
    const raw = String(row["tag:User:Ad group Name"] ?? "").trim();
    if (!raw || raw === "-no value-") continue;
    const key = raw.toLowerCase();
    byName.set(key, {
      name: raw,
      incomingCalls: parseNumber(row.callCount),
      revenue: parseNumber(row.conversionAmount),
      payout: parseNumber(row.payoutAmount),
    });
  }

  return byName;
}

function lookupCampaignRingba(byName, campaignName) {
  if (!byName?.size || !campaignName) return null;
  const exact = byName.get(String(campaignName).trim().toLowerCase());
  if (exact) return exact;
  // Loose contains match if names differ slightly
  const needle = String(campaignName).trim().toLowerCase();
  for (const [key, val] of byName.entries()) {
    if (key.includes(needle) || needle.includes(key)) return val;
  }
  return null;
}

/**
 * Per-adset Ringba attribution via publisherSubId.
 * Same publisher + campaign filters as account insights; returns Map<subId, {calls, revenue}>.
 */
async function fetchRingbaMetricsBySubId({ dayYmd, publisherName, campaignName, ringbaCampaignId }) {
  const empty = new Map();
  if (!hasRingbaConfig) return empty;
  if (!publisherName && !campaignName && !ringbaCampaignId) return empty;

  const { reportStart, reportEnd } = etDayWindow(dayYmd);
  const filters = [];
  if (publisherName) {
    filters.push({
      anyConditionToMatch: [
        { column: "publisherName", value: publisherName, comparisonType: "EQUALS" },
      ],
    });
  }
  if (campaignName) {
    filters.push({
      anyConditionToMatch: [
        { column: "campaignName", value: campaignName, comparisonType: "EQUALS" },
      ],
    });
  } else if (ringbaCampaignId) {
    filters.push({
      anyConditionToMatch: [
        { column: "campaignId", value: ringbaCampaignId, comparisonType: "EQUALS" },
      ],
    });
  }

  const metrics = new Map();
  const pageSize = 200;
  let offset = 0;

  while (offset < 20_000) {
    const json = await ringbaPost("/calllogs", {
      reportStart,
      reportEnd,
      filters,
      valueColumns: [
        { column: "inboundCallId" },
        { column: "publisherSubId" },
        { column: "publisherName" },
        { column: "campaignName" },
        { column: "campaignId" },
        { column: "conversionAmount" },
        { column: "payoutAmount" },
      ],
      formatTimeZone: "America/New_York",
      size: pageSize,
      offset,
    });

    const records = json?.report?.records || [];
    if (!records.length) break;

    for (const row of records) {
      const sub = String(row.publisherSubId || "").trim();
      if (!sub) continue;
      const revenue = parseNumber(row.conversionAmount) || parseNumber(row.payoutAmount);
      const bump = (key) => {
        const prev = metrics.get(key) || { calls: 0, revenue: 0 };
        prev.calls += 1;
        prev.revenue += revenue;
        metrics.set(key, prev);
      };
      bump(sub);
      const lower = sub.toLowerCase();
      if (lower !== sub) bump(lower);
    }

    if (records.length < pageSize) break;
    offset += pageSize;
  }

  return metrics;
}

function resolveSubMetrics(adset, metricsBySubId) {
  if (!metricsBySubId?.size) return { incomingCalls: 0, revenue: 0 };
  const id = String(adset.id || "");
  const name = String(adset.name || "").trim();
  const hit =
    metricsBySubId.get(id) ||
    metricsBySubId.get(name) ||
    metricsBySubId.get(name.toLowerCase()) ||
    null;
  return {
    incomingCalls: hit?.calls || 0,
    revenue: hit?.revenue || 0,
  };
}

export async function listBigoAccounts() {
  requireBigo();
  const { list } = await bigoListAll("/openapi/ad_account/list", {});
  return { accounts: list.map(summarizeAccount) };
}

export async function listBigoCampaigns(advertiserId) {
  requireBigo();
  if (!advertiserId) throw new Error("advertiserId is required");
  const { list, total } = await bigoListAll("/openapi/campaign/list", {}, { advertiserId });
  return { advertiserId: String(advertiserId), total, campaigns: list.map(summarizeCampaign) };
}

export async function listTrackedCampaigns() {
  requireMongo();
  const docs = await BigoTrackedCampaign.find({}).sort({ advertiserName: 1, campaignName: 1 }).lean();
  return { campaigns: docs.map(normalizeTracked) };
}

/**
 * Replace tracked set with the provided campaigns (multi-account ready).
 * @param {Array<{advertiserId, advertiserName?, timezone?, currency?, campaignId, campaignName?}>} campaigns
 */
export async function setTrackedCampaigns(campaigns, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const incoming = Array.isArray(campaigns) ? campaigns : [];

  const normalized = [];
  const seen = new Set();
  for (const row of incoming) {
    const advertiserId = String(row.advertiserId || "").trim();
    const campaignId = String(row.campaignId || "").trim();
    if (!advertiserId || !campaignId) continue;
    const key = `${advertiserId}::${campaignId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      advertiserId,
      advertiserName: String(row.advertiserName || "").trim(),
      timezone: Number(row.timezone) || -5,
      currency: String(row.currency || "USD").trim() || "USD",
      campaignId,
      campaignName: String(row.campaignName || "").trim(),
      trackedBy: actor,
    });
  }

  await BigoTrackedCampaign.deleteMany({});
  if (normalized.length) {
    await BigoTrackedCampaign.insertMany(normalized);
  }

  return listTrackedCampaigns();
}

async function fetchReportByAdset({ advertiserId, campaignIds, timezone, startDate, endDate }) {
  // Keep indicators minimal — extra name fields have caused "query fail" on this API.
  const indicators = ["totalCost", "real_result_conversion", "click", "impression"];

  const pageSize = 100;
  let pageNo = 1;
  const rows = [];
  let total = null;

  while (pageNo <= 50) {
    const json = await bigoPost(
      "/openapi/report/list",
      {
        advertiserId: [String(advertiserId)],
        campaignId: campaignIds.map(String),
        timezone: Number(timezone),
        startDate,
        endDate,
        indicators,
        breakDowns: ["adsetId"],
        aggregateType: 2, // Day
        pageNo,
        pageSize,
      },
      { advertiserId }
    );
    const list = json?.result?.list || [];
    total = json?.result?.total ?? total;
    rows.push(...list);
    if (!list.length || rows.length >= (total ?? rows.length) || list.length < pageSize) break;
    pageNo += 1;
    // Report API is ~1 QPS
    await new Promise((r) => setTimeout(r, 1100));
  }

  return rows;
}

/**
 * Live controller view: tracked campaigns → ad sets + today's cost/conversions.
 */
export async function getControllerLive() {
  requireMongo();
  requireBigo();

  const tracked = await BigoTrackedCampaign.find({}).sort({ advertiserName: 1, campaignName: 1 }).lean();
  if (!tracked.length) {
    return { accounts: [], campaigns: [], adsets: [], fetchedAt: new Date().toISOString() };
  }

  // Group by advertiser for fewer API calls
  const byAdvertiser = new Map();
  for (const row of tracked) {
    if (!byAdvertiser.has(row.advertiserId)) {
      byAdvertiser.set(row.advertiserId, {
        advertiserId: row.advertiserId,
        advertiserName: row.advertiserName,
        timezone: row.timezone ?? -5,
        currency: row.currency || "USD",
        campaigns: [],
      });
    }
    byAdvertiser.get(row.advertiserId).campaigns.push(row);
  }

  const adsetOut = [];
  const campaignStatusByKey = new Map();

  let adAccounts = [];
  try {
    adAccounts = await listAdAccounts();
  } catch {
    adAccounts = [];
  }

  // Account-level Ringba insights (publisher + campaign) — authoritative totals
  const accountRingbaById = new Map();
  /** advertiserId → Map(campaignNameLower → {incomingCalls, revenue}) */
  const campaignRingbaByAdvertiserId = new Map();
  /** advertiserId → Map(adGroupNameLower → {incomingCalls, revenue}) */
  const adGroupRingbaByAdvertiserId = new Map();

  for (const group of byAdvertiser.values()) {
    const campaignIds = group.campaigns.map((c) => c.campaignId);
    const day = dateStringForOffset(group.timezone);

    const linked = adAccounts.find(
      (a) => String(a.bigoAccountId || "") === String(group.advertiserId)
    );
    const ringbaFilters = resolveRingbaFilters({
      linkedAccount: linked,
      advertiserName: group.advertiserName,
    });

    let accountRingba = { incomingCalls: 0, revenue: 0 };
    try {
      accountRingba = await fetchRingbaAccountInsights({
        dayYmd: day,
        publisherName: ringbaFilters.publisherName,
        campaignName: ringbaFilters.campaignName,
      });
    } catch (err) {
      console.warn("Ringba account insights failed:", err.message);
    }
    accountRingbaById.set(group.advertiserId, {
      ...accountRingba,
      ...ringbaFilters,
      reportDate: day,
    });

    let campaignTagMetrics = new Map();
    try {
      campaignTagMetrics = await fetchRingbaByCampaignTag({
        dayYmd: day,
        publisherName: ringbaFilters.publisherName,
        campaignName: ringbaFilters.campaignName,
      });
    } catch (err) {
      console.warn("Ringba campaign-tag insights failed:", err.message);
    }
    campaignRingbaByAdvertiserId.set(group.advertiserId, campaignTagMetrics);

    let adGroupTagMetrics = new Map();
    try {
      adGroupTagMetrics = await fetchRingbaByAdGroupTag({
        dayYmd: day,
        publisherName: ringbaFilters.publisherName,
        campaignName: ringbaFilters.campaignName,
      });
    } catch (err) {
      console.warn("Ringba ad-group-tag insights failed:", err.message);
    }
    adGroupRingbaByAdvertiserId.set(group.advertiserId, adGroupTagMetrics);

    let ringbaBySub = new Map();
    try {
      ringbaBySub = await fetchRingbaMetricsBySubId({
        dayYmd: day,
        publisherName: ringbaFilters.publisherName,
        campaignName: ringbaFilters.campaignName,
        ringbaCampaignId: ringbaFilters.ringbaCampaignId,
      });
    } catch (err) {
      console.warn("Ringba calllog attribution failed:", err.message);
    }

    // Campaign status for pause icon
    try {
      const { list: campaignList } = await bigoListAll(
        "/openapi/campaign/list",
        {},
        { advertiserId: group.advertiserId }
      );
      for (const c of campaignList) {
        const id = String(c.id ?? c.campaignId ?? "");
        if (!id) continue;
        const status = Number(c.status);
        campaignStatusByKey.set(`${group.advertiserId}::${id}`, {
          status,
          paused: status === 2,
          name: c.name || c.campaignName || "",
        });
      }
    } catch (err) {
      console.warn("BIGO campaign list for status failed:", err.message);
    }

    // Ad sets for tracked campaigns on this account
    const { list: adsets } = await bigoListAll(
      "/openapi/adset/list",
      { campaignId: campaignIds.map(String) },
      { advertiserId: group.advertiserId }
    );

    let reportRows = [];
    try {
      reportRows = await fetchReportByAdset({
        advertiserId: group.advertiserId,
        campaignIds,
        timezone: group.timezone,
        startDate: day,
        endDate: day,
      });
    } catch (err) {
      console.warn("BIGO report fetch failed:", err.message);
    }

    const metricsByAdset = new Map();
    for (const row of reportRows) {
      const id = String(row.adsetId ?? "");
      if (!id) continue;
      metricsByAdset.set(id, {
        cost: fromBigoMoney(row.totalCost),
        conversions: Number(row.real_result_conversion) || 0,
        clicks: Number(row.click) || 0,
        impressions: Number(row.impression) || 0,
      });
    }

    const campaignNameById = new Map(
      group.campaigns.map((c) => [String(c.campaignId), c.campaignName || ""])
    );

    for (const a of adsets) {
      const summary = summarizeAdset(a);
      const metrics = metricsByAdset.get(summary.id) || {
        cost: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0,
      };
      const ringba = resolveSubMetrics(summary, ringbaBySub);
      const incomingCalls = ringba.incomingCalls;
      const revenue = ringba.revenue;
      const cpc = calcCpc(metrics.cost, incomingCalls);
      adsetOut.push({
        ...summary,
        advertiserId: group.advertiserId,
        advertiserName: group.advertiserName,
        campaignName: campaignNameById.get(summary.campaignId) || "",
        currency: group.currency,
        reportDate: day,
        cost: metrics.cost,
        conversions: metrics.conversions,
        incomingCalls,
        revenue,
        cpc,
      });
    }
  }

  adsetOut.sort((a, b) => {
    const left = `${a.advertiserName}|${a.campaignName}|${a.name}`;
    const right = `${b.advertiserName}|${b.campaignName}|${b.name}`;
    return left.localeCompare(right);
  });

  // Prefer publisherSubId, then Ad group Name tag, else allocate campaign tag by cost.
  for (const group of byAdvertiser.values()) {
    const adGroupTagMap = adGroupRingbaByAdvertiserId.get(group.advertiserId);
    const campaignTagMap = campaignRingbaByAdvertiserId.get(group.advertiserId);
    const rows = adsetOut.filter((r) => r.advertiserId === group.advertiserId);

    for (const row of rows) {
      if ((Number(row.incomingCalls) || 0) > 0 || (Number(row.revenue) || 0) > 0) continue;
      const hit = lookupCampaignRingba(adGroupTagMap, row.name);
      if (!hit) continue;
      row.incomingCalls = Number(hit.incomingCalls) || 0;
      row.revenue = Number(hit.revenue) || 0;
      row.cpc = calcCpc(row.cost, row.incomingCalls);
      row.ringbaAdGroupTagged = true;
    }

    const needsAlloc = rows.filter(
      (r) => !(Number(r.incomingCalls) || 0) && !(Number(r.revenue) || 0)
    );
    if (!needsAlloc.length) continue;

    const byCampaign = new Map();
    for (const row of needsAlloc) {
      const cKey = String(row.campaignId);
      if (!byCampaign.has(cKey)) byCampaign.set(cKey, []);
      byCampaign.get(cKey).push(row);
    }

    for (const [, campRows] of byCampaign.entries()) {
      const campName = campRows[0]?.campaignName || "";
      const ringba = lookupCampaignRingba(campaignTagMap, campName);
      const campCalls = Number(ringba?.incomingCalls) || 0;
      const campRevenue = Number(ringba?.revenue) || 0;
      if (campCalls <= 0 && campRevenue <= 0) continue;

      const siblings = rows.filter((r) => String(r.campaignId) === String(campRows[0].campaignId));
      const claimedCalls = siblings.reduce((sum, r) => sum + (Number(r.incomingCalls) || 0), 0);
      const claimedRevenue = siblings.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
      const remainCalls = Math.max(0, campCalls - claimedCalls);
      const remainRevenue = Math.max(0, campRevenue - claimedRevenue);
      if (remainCalls <= 0 && remainRevenue <= 0) continue;

      const totalCost = campRows.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
      if (totalCost <= 0) {
        const n = campRows.length || 1;
        for (const row of campRows) {
          row.incomingCalls = remainCalls / n;
          row.revenue = remainRevenue / n;
          row.cpc = calcCpc(row.cost, row.incomingCalls);
          row.ringbaAllocated = true;
        }
        continue;
      }

      for (const row of campRows) {
        const share = (Number(row.cost) || 0) / totalCost;
        row.incomingCalls = remainCalls * share;
        row.revenue = remainRevenue * share;
        row.cpc = calcCpc(row.cost, row.incomingCalls);
        row.ringbaAllocated = true;
      }
    }
  }

  // Attach profit / ROI on every ad set
  for (let i = 0; i < adsetOut.length; i += 1) {
    adsetOut[i] = withPnl(adsetOut[i]);
  }

  // Roll up ad set metrics → campaign + account totals
  const campaignAgg = new Map();
  const accountAgg = new Map();

  for (const row of adsetOut) {
    const cKey = `${row.advertiserId}::${row.campaignId}`;
    if (!campaignAgg.has(cKey)) {
      campaignAgg.set(cKey, {
        advertiserId: row.advertiserId,
        advertiserName: row.advertiserName,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        currency: row.currency,
        reportDate: row.reportDate,
        cost: 0,
        conversions: 0,
        incomingCalls: 0,
        revenue: 0,
        adsetCount: 0,
        pausedAdsets: 0,
      });
    }
    const c = campaignAgg.get(cKey);
    c.cost += Number(row.cost) || 0;
    c.conversions += Number(row.conversions) || 0;
    c.incomingCalls += Number(row.incomingCalls) || 0;
    c.revenue += Number(row.revenue) || 0;
    c.adsetCount += 1;
    if (row.paused) c.pausedAdsets += 1;

    if (!accountAgg.has(row.advertiserId)) {
      accountAgg.set(row.advertiserId, {
        advertiserId: row.advertiserId,
        advertiserName: row.advertiserName,
        currency: row.currency,
        reportDate: row.reportDate,
        cost: 0,
        conversions: 0,
        incomingCalls: 0,
        revenue: 0,
        campaignCount: 0,
        adsetCount: 0,
      });
    }
    const acc = accountAgg.get(row.advertiserId);
    acc.cost += Number(row.cost) || 0;
    acc.conversions += Number(row.conversions) || 0;
    acc.incomingCalls += Number(row.incomingCalls) || 0;
    acc.revenue += Number(row.revenue) || 0;
    acc.adsetCount += 1;
  }

  const campaignOut = tracked.map((doc) => {
    const base = normalizeTracked(doc);
    const key = `${base.advertiserId}::${base.campaignId}`;
    const agg = campaignAgg.get(key);
    const statusInfo = campaignStatusByKey.get(key);
    const cost = agg?.cost || 0;
    const conversions = agg?.conversions || 0;
    const campName = base.campaignName || statusInfo?.name || "";
    const tagHit = lookupCampaignRingba(
      campaignRingbaByAdvertiserId.get(base.advertiserId),
      campName
    );
    // Campaign Ringba tag metrics are authoritative when present
    const incomingCalls = tagHit
      ? Number(tagHit.incomingCalls) || 0
      : Number(agg?.incomingCalls) || 0;
    const revenue = tagHit ? Number(tagHit.revenue) || 0 : Number(agg?.revenue) || 0;
    const paused =
      typeof statusInfo?.paused === "boolean"
        ? statusInfo.paused
        : Boolean(agg?.adsetCount && agg.pausedAdsets === agg.adsetCount);
    return withPnl({
      ...base,
      name: campName,
      status: statusInfo?.status ?? null,
      paused,
      reportDate: agg?.reportDate || dateStringForOffset(doc.timezone ?? -5),
      cost,
      conversions,
      incomingCalls,
      revenue,
      cpc: calcCpc(cost, incomingCalls),
      adsetCount: agg?.adsetCount || 0,
    });
  });

  const accountsOut = [...accountAgg.values()].map((acc) => {
    const campaignCount = tracked.filter((t) => t.advertiserId === acc.advertiserId).length;
    const ringba = accountRingbaById.get(acc.advertiserId);
    // Account-level Ringba insights are authoritative when publisher+campaign filters resolve
    const hasInsights = Boolean(ringba?.publisherName && ringba?.campaignName);
    const incomingCalls = hasInsights
      ? Number(ringba.incomingCalls) || 0
      : Number(acc.incomingCalls) || 0;
    const revenue = hasInsights ? Number(ringba.revenue) || 0 : Number(acc.revenue) || 0;
    return withPnl({
      ...acc,
      campaignCount,
      incomingCalls,
      revenue,
      cpc: calcCpc(acc.cost, incomingCalls),
      ringbaPublisher: ringba?.publisherName || "",
      ringbaCampaignName: ringba?.campaignName || "",
    });
  });
  accountsOut.sort((a, b) => (a.advertiserName || "").localeCompare(b.advertiserName || ""));

  return {
    accounts: accountsOut,
    campaigns: campaignOut,
    adsets: adsetOut,
    fetchedAt: new Date().toISOString(),
    source: "live",
  };
}

async function saveControllerSnapshot(payload, error = "") {
  requireMongo();
  const fetchedAt = payload.fetchedAt ? new Date(payload.fetchedAt) : new Date();
  await BigoControllerSnapshot.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        accounts: payload.accounts || [],
        campaigns: payload.campaigns || [],
        adsets: payload.adsets || [],
        fetchedAt,
        error: error || "",
      },
    },
    { upsert: true }
  );
}

/** Percent change vs previous snapshot. Null when no usable baseline. */
function pctChange(prev, next) {
  const p = Number(prev);
  const n = Number(next);
  if (!Number.isFinite(n) || !Number.isFinite(p) || p <= 0) return null;
  const pct = ((n - p) / p) * 100;
  return Number.isFinite(pct) ? pct : null;
}

function entityTrendKey(row, level) {
  if (level === "account") return String(row.advertiserId || "");
  if (level === "campaign") return `${row.advertiserId || ""}::${row.campaignId || ""}`;
  return `${row.advertiserId || ""}::${row.id || ""}`;
}

/** Attach cost/cpc deltas vs the previous controller snapshot (5-min movement). */
function attachMetricDeltas(nextRows, prevRows, level) {
  const prevMap = new Map();
  for (const row of prevRows || []) {
    const key = entityTrendKey(row, level);
    if (key && key !== "::") prevMap.set(key, row);
  }
  return (nextRows || []).map((row) => {
    const prev = prevMap.get(entityTrendKey(row, level));
    return {
      ...row,
      costDeltaPct: prev ? pctChange(prev.cost, row.cost) : null,
      cpcDeltaPct: prev ? pctChange(prev.cpc, row.cpc) : null,
    };
  });
}

export async function getControllerSnapshot() {
  requireMongo();
  const doc = await BigoControllerSnapshot.findOne({ key: "default" }).lean();
  if (!doc) {
    return {
      accounts: [],
      campaigns: [],
      adsets: [],
      fetchedAt: null,
      source: "snapshot",
      stale: true,
      error: "",
    };
  }
  return {
    accounts: doc.accounts || [],
    campaigns: doc.campaigns || [],
    adsets: doc.adsets || [],
    fetchedAt: doc.fetchedAt ? new Date(doc.fetchedAt).toISOString() : null,
    source: "snapshot",
    stale: false,
    error: doc.error || "",
  };
}

/**
 * Pull live from BIGO and persist snapshot (used by 5-min job + forced refresh).
 */
export async function syncControllerLive() {
  const live = await getControllerLive();
  let prev = { accounts: [], campaigns: [], adsets: [] };
  try {
    prev = await getControllerSnapshot();
  } catch {
    /* first run — no prior snapshot */
  }

  const withTrends = {
    ...live,
    accounts: attachMetricDeltas(live.accounts, prev.accounts, "account"),
    campaigns: attachMetricDeltas(live.campaigns, prev.campaigns, "campaign"),
    adsets: attachMetricDeltas(live.adsets, prev.adsets, "adset"),
  };

  await saveControllerSnapshot(withTrends);
  return { ...withTrends, source: "live" };
}

/**
 * Default page read: return Mongo snapshot.
 * forceRefresh=true hits BIGO and updates snapshot.
 */
export async function getControllerLiveView({ forceRefresh = false } = {}) {
  if (forceRefresh) {
    return syncControllerLive();
  }

  const snap = await getControllerSnapshot();
  if (snap.fetchedAt) return snap;

  // First run — seed snapshot from live pull
  try {
    return await syncControllerLive();
  } catch (error) {
    return {
      accounts: [],
      campaigns: [],
      adsets: [],
      fetchedAt: null,
      source: "snapshot",
      stale: true,
      error: error.message,
    };
  }
}

/**
 * Update ad set basic goal bid (secondBid) and/or daily budget.
 * Config money fields are currency units (not ×100 like report cost).
 * @param {{ advertiserId: string, adsetId: string, basicGoalBid?: number, budget?: number, budgetMode?: number }}
 */
export async function updateAdsetBidBudget({
  advertiserId,
  adsetId,
  basicGoalBid,
  budget,
  budgetMode,
}) {
  requireBigo();
  if (!advertiserId) throw new Error("advertiserId is required");
  if (!adsetId) throw new Error("adsetId is required");

  const body = { id: String(adsetId) };
  let touched = false;

  if (basicGoalBid !== undefined && basicGoalBid !== null && basicGoalBid !== "") {
    const bid = Number(basicGoalBid);
    if (!Number.isFinite(bid) || bid <= 0) {
      throw new Error("basicGoalBid must be a positive number");
    }
    body.secondBid = String(bid);
    touched = true;
  }

  if (budget !== undefined && budget !== null && budget !== "") {
    const amount = Number(budget);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("budget must be a positive number");
    }
    body.budget = String(amount);
    if (budgetMode !== undefined && budgetMode !== null && budgetMode !== "") {
      body.budgetMode = Number(budgetMode);
    }
    touched = true;
  }

  if (!touched) throw new Error("basicGoalBid or budget is required");

  await bigoPost("/openapi/adset/update", body, { advertiserId });

  try {
    await syncControllerLive();
  } catch (err) {
    console.warn("Snapshot refresh after adset bid/budget update failed:", err.message);
  }

  return {
    ok: true,
    adsetId: String(adsetId),
    basicGoalBid: body.secondBid != null ? Number(body.secondBid) : undefined,
    budget: body.budget != null ? Number(body.budget) : undefined,
    budgetMode: body.budgetMode,
  };
}

/**
 * Pause / unpause a BIGO ad set.
 * @param {{ advertiserId: string, adsetId: string, paused: boolean }}
 */
export async function setAdsetPaused({ advertiserId, adsetId, paused }) {
  requireBigo();
  if (!advertiserId) throw new Error("advertiserId is required");
  if (!adsetId) throw new Error("adsetId is required");

  const status = paused ? 2 : 1; // 2 Suspend, 1 Enable
  await bigoPost(
    "/openapi/adset/update_status",
    { ids: [String(adsetId)], status },
    { advertiserId }
  );

  // Refresh snapshot so UI picks up new status
  try {
    await syncControllerLive();
  } catch (err) {
    console.warn("Snapshot refresh after adset status change failed:", err.message);
  }

  return { ok: true, adsetId: String(adsetId), paused: Boolean(paused), status };
}

/**
 * Pause / unpause a BIGO campaign.
 * @param {{ advertiserId: string, campaignId: string, paused: boolean }}
 */
export async function setCampaignPaused({ advertiserId, campaignId, paused }) {
  requireBigo();
  if (!advertiserId) throw new Error("advertiserId is required");
  if (!campaignId) throw new Error("campaignId is required");

  const status = paused ? 2 : 1; // 2 Suspend, 1 Enable
  await bigoPost(
    "/openapi/campaign/update_status",
    { ids: [String(campaignId)], status },
    { advertiserId }
  );

  try {
    await syncControllerLive();
  } catch (err) {
    console.warn("Snapshot refresh after campaign status change failed:", err.message);
  }

  return { ok: true, campaignId: String(campaignId), paused: Boolean(paused), status };
}
