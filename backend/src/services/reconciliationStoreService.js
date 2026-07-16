import { ReconciliationSnapshot } from "../models/ReconciliationSnapshot.js";
import { getLastWeekRange } from "../utils/dateRange.js";

function inferOfferType(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("final expense") || lower.includes(" fe")) return "FE";
  if (lower.includes("aca")) return "ACA";
  if (lower.includes("medicare")) return "Medicare";
  return "Other";
}

function emptySummary(campaignName, buyerName) {
  return {
    campaign: campaignName,
    buyer: buyerName || "",
    calls: 0,
    convertedCalls: 0,
    rpc: 0,
    revenue: 0,
    payout: 0,
    profit: 0,
    convertedPercent: 0,
  };
}

function round(value) {
  return Number((Number(value) || 0).toFixed(2));
}

function safeDivide(numerator, denominator) {
  if (!denominator) return 0;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : 0;
}

/** Snapshots whose week window overlaps [startDate, endDate]. */
function overlapQuery({ campaignName, buyerName, startDate, endDate }) {
  const query = {
    campaignName,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };
  if (buyerName) query.buyerName = buyerName;
  return query;
}

function aggregateSnapshots(snapshots, { campaignName, buyerName }) {
  if (!snapshots.length) {
    return {
      summary: emptySummary(campaignName, buyerName),
      calls: [],
      totalCallLogs: 0,
      soldCallCount: 0,
      syncedAt: null,
    };
  }

  let calls = 0;
  let convertedCalls = 0;
  let revenue = 0;
  let payout = 0;
  let profit = 0;
  let totalCallLogs = 0;
  let syncedAt = null;
  const soldCalls = [];

  for (const snapshot of snapshots) {
    const summary = snapshot.summary || {};
    calls += Number(summary.calls) || 0;
    convertedCalls += Number(summary.convertedCalls) || 0;
    revenue += Number(summary.revenue) || 0;
    payout += Number(summary.payout) || 0;
    profit += Number(summary.profit) || 0;
    totalCallLogs += Number(snapshot.totalCallLogs) || 0;
    soldCalls.push(...(snapshot.calls || []));
    if (!syncedAt || (snapshot.syncedAt && snapshot.syncedAt > syncedAt)) {
      syncedAt = snapshot.syncedAt;
    }
  }

  soldCalls.sort((a, b) => String(b.callDtRaw || "").localeCompare(String(a.callDtRaw || "")));

  return {
    summary: {
      campaign: campaignName,
      buyer: buyerName || snapshots[0]?.buyerName || "",
      calls,
      convertedCalls,
      rpc: round(safeDivide(revenue, convertedCalls)),
      revenue: round(revenue),
      payout: round(payout),
      profit: round(profit),
      convertedPercent: round(safeDivide(convertedCalls, calls) * 100),
    },
    calls: soldCalls,
    totalCallLogs,
    soldCallCount: soldCalls.length,
    syncedAt,
  };
}

export async function getReconciliationData({ campaignName, buyerName, startDate, endDate }) {
  // Prefer exact week match, then fall back to overlapping weeks (multi-week ranges).
  const exactQuery = { startDate, endDate, campaignName };
  if (buyerName) exactQuery.buyerName = buyerName;

  let snapshots = await ReconciliationSnapshot.find(exactQuery).lean();
  if (!snapshots.length) {
    snapshots = await ReconciliationSnapshot.find(
      overlapQuery({ campaignName, buyerName, startDate, endDate })
    )
      .sort({ startDate: 1 })
      .lean();
  }

  const aggregated = aggregateSnapshots(snapshots, { campaignName, buyerName });
  return {
    dateRange: { startDate, endDate },
    ...aggregated,
  };
}

export async function getBuyersForCampaign(campaignName, startDate, endDate) {
  let snapshots = await ReconciliationSnapshot.find({ startDate, endDate, campaignName })
    .select("buyerName summary.calls")
    .lean();

  if (!snapshots.length) {
    snapshots = await ReconciliationSnapshot.find(
      overlapQuery({ campaignName, startDate, endDate })
    )
      .select("buyerName summary.calls")
      .lean();
  }

  const buyerMap = new Map();
  for (const snapshot of snapshots) {
    const name = snapshot.buyerName;
    if (!name) continue;
    const existing = buyerMap.get(name) || { name, callCount: 0 };
    existing.callCount += Number(snapshot.summary?.calls) || 0;
    buyerMap.set(name, existing);
  }

  return [...buyerMap.values()].sort((a, b) => b.callCount - a.callCount);
}

export async function getReconciliationFilters(startDate, endDate) {
  const defaultRange = getLastWeekRange();
  const weeks = await listSyncedWeeks();
  const range = {
    startDate: startDate || weeks[0]?.startDate || defaultRange.startDate,
    endDate: endDate || weeks[0]?.endDate || defaultRange.endDate,
  };

  let snapshots = await ReconciliationSnapshot.find({
    startDate: range.startDate,
    endDate: range.endDate,
  }).lean();

  if (!snapshots.length) {
    snapshots = await ReconciliationSnapshot.find({
      startDate: { $lte: range.endDate },
      endDate: { $gte: range.startDate },
    }).lean();
  }

  const campaignMap = new Map();
  const buyerMap = new Map();
  let lastSyncedAt = null;

  for (const snapshot of snapshots) {
    if (!campaignMap.has(snapshot.campaignName)) {
      campaignMap.set(snapshot.campaignName, {
        id: snapshot.campaignId || snapshot.campaignName,
        name: snapshot.campaignName,
        offerType: inferOfferType(snapshot.campaignName),
        enabled: true,
      });
    }

    const buyerKey = snapshot.buyerName;
    const existingBuyer = buyerMap.get(buyerKey) || { name: buyerKey, callCount: 0 };
    existingBuyer.callCount += Number(snapshot.summary?.calls) || 0;
    buyerMap.set(buyerKey, existingBuyer);

    if (!lastSyncedAt || snapshot.syncedAt > lastSyncedAt) {
      lastSyncedAt = snapshot.syncedAt;
    }
  }

  const campaigns = [...campaignMap.values()];
  const buyers = [...buyerMap.values()].sort((a, b) => b.callCount - a.callCount);
  const feCampaign =
    campaigns.find((c) => c.name === "NLM - Final Expense") ||
    campaigns.find((c) => c.offerType === "FE") ||
    campaigns[0] ||
    null;

  return {
    campaigns,
    buyers,
    weeks,
    defaultRange: weeks[0]
      ? { startDate: weeks[0].startDate, endDate: weeks[0].endDate }
      : defaultRange,
    defaultCampaign: feCampaign,
    defaultBuyer: buyers.find((b) => b.name === "Elijay Marketing") || buyers[0] || null,
    lastSyncedAt,
  };
}

export async function listSyncedWeeks() {
  const weeks = await ReconciliationSnapshot.aggregate([
    {
      $group: {
        _id: { startDate: "$startDate", endDate: "$endDate" },
        lastSyncedAt: { $max: "$syncedAt" },
        snapshotCount: { $sum: 1 },
      },
    },
    { $match: { snapshotCount: { $gt: 0 } } },
    { $sort: { "_id.endDate": -1 } },
  ]);

  return weeks.map((week) => ({
    startDate: week._id.startDate,
    endDate: week._id.endDate,
    lastSyncedAt: week.lastSyncedAt,
  }));
}
