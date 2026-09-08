import { ReconciliationExcludedCall } from "../models/ReconciliationExcludedCall.js";
import { ReconciliationSnapshot } from "../models/ReconciliationSnapshot.js";
import { getLastWeekRange, toEasternDateString } from "../utils/dateRange.js";
import { buildCallKey, callMatchesKey, normalizePhone } from "../utils/reconciliationCallKey.js";

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

/** Calendar date (YYYY-MM-DD) of a call in Eastern time. */
function getCallEasternDate(call) {
  const raw = call?.callDtRaw;
  if (raw == null || raw === "") return null;

  const ms = typeof raw === "number" ? raw : Number(raw);
  if (Number.isFinite(ms) && ms > 0) {
    return toEasternDateString(new Date(ms));
  }

  // Fallback: parse display string like "7/15/2026, 3:04 PM"
  const parsed = new Date(call.callDt);
  if (!Number.isNaN(parsed.getTime())) {
    return toEasternDateString(parsed);
  }

  return null;
}

function callInDateRange(call, startDate, endDate) {
  const day = getCallEasternDate(call);
  if (!day) return false;
  return day >= startDate && day <= endDate;
}

function summarizeSoldCalls(soldCalls, campaignName, buyerName) {
  const revenue = soldCalls.reduce((sum, call) => sum + (Number(call.conversionAmount) || 0), 0);
  const payout = soldCalls.reduce((sum, call) => sum + (Number(call.payoutAmount) || 0), 0);
  const convertedCalls = soldCalls.length;
  // Sold-call store only keeps converted rows; Inc mirrors converted for date-filtered views.
  const calls = convertedCalls;
  const profit = revenue - payout;

  return {
    campaign: campaignName,
    buyer: buyerName || "",
    calls,
    convertedCalls,
    rpc: round(safeDivide(revenue, convertedCalls)),
    revenue: round(revenue),
    payout: round(payout),
    profit: round(profit),
    convertedPercent: round(safeDivide(convertedCalls, calls) * 100),
  };
}

async function getExclusionKeySet(campaignName, buyerName) {
  const query = {};
  if (campaignName) query.campaignName = campaignName;
  if (buyerName) query.buyerName = buyerName;

  const exclusions = await ReconciliationExcludedCall.find(query).lean();
  return new Set(
    exclusions.map((row) =>
      buildCallKey({
        campaignName: row.campaignName,
        buyerName: row.buyerName,
        callDtRaw: row.callDtRaw,
        inboundPhoneNumber: row.inboundPhoneNumber,
        conversionAmount: row.conversionAmount,
      })
    )
  );
}

function isCallExcluded(call, campaignName, buyerName, exclusionKeys) {
  if (!exclusionKeys?.size) return false;
  return exclusionKeys.has(
    buildCallKey({
      campaignName,
      buyerName,
      callDtRaw: call?.callDtRaw,
      inboundPhoneNumber: call?.inboundPhoneNumber,
      conversionAmount: call?.conversionAmount,
    })
  );
}

/** Drop excluded disputed calls (and optionally recompute week snapshot summary fields). */
export function filterExcludedCalls(calls, campaignName, buyerName, exclusionKeys) {
  if (!exclusionKeys?.size) return calls || [];
  return (calls || []).filter((call) => !isCallExcluded(call, campaignName, buyerName, exclusionKeys));
}

/** Build summary + call list from sold calls filtered to the date picker range. */
function aggregateCallsInRange(snapshots, { campaignName, buyerName, startDate, endDate, exclusionKeys }) {
  if (!snapshots.length) {
    return {
      summary: emptySummary(campaignName, buyerName),
      calls: [],
      totalCallLogs: 0,
      soldCallCount: 0,
      syncedAt: null,
    };
  }

  let syncedAt = null;
  const soldCalls = [];

  for (const snapshot of snapshots) {
    const snapBuyer = buyerName || snapshot.buyerName || "";
    for (const call of snapshot.calls || []) {
      if (isCallExcluded(call, campaignName, snapBuyer, exclusionKeys)) continue;
      if (callInDateRange(call, startDate, endDate)) {
        soldCalls.push(call);
      }
    }
    if (!syncedAt || (snapshot.syncedAt && snapshot.syncedAt > syncedAt)) {
      syncedAt = snapshot.syncedAt;
    }
  }

  soldCalls.sort((a, b) => String(b.callDtRaw || "").localeCompare(String(a.callDtRaw || "")));

  return {
    summary: summarizeSoldCalls(soldCalls, campaignName, buyerName || snapshots[0]?.buyerName || ""),
    calls: soldCalls,
    totalCallLogs: soldCalls.length,
    soldCallCount: soldCalls.length,
    syncedAt,
  };
}

export async function getReconciliationData({ campaignName, buyerName, startDate, endDate }) {
  // Always load overlapping weekly snapshots, then filter calls to the date picker.
  const [snapshots, exclusionKeys] = await Promise.all([
    ReconciliationSnapshot.find(overlapQuery({ campaignName, buyerName, startDate, endDate }))
      .sort({ startDate: 1 })
      .lean(),
    getExclusionKeySet(campaignName, buyerName),
  ]);

  return {
    dateRange: { startDate, endDate },
    ...aggregateCallsInRange(snapshots, {
      campaignName,
      buyerName,
      startDate,
      endDate,
      exclusionKeys,
    }),
  };
}

/**
 * Permanently remove a disputed sold call from Mongo snapshots and record an exclusion
 * so the next Ringba sync does not restore it.
 */
export async function removeReconciliationCall({
  campaignName,
  buyerName,
  callDtRaw,
  inboundPhoneNumber,
  conversionAmount,
}) {
  if (!campaignName || !buyerName || callDtRaw == null || callDtRaw === "") {
    throw new Error("campaignName, buyerName, and callDtRaw are required");
  }

  const key = buildCallKey({
    campaignName,
    buyerName,
    callDtRaw,
    inboundPhoneNumber,
    conversionAmount,
  });

  const snapshots = await ReconciliationSnapshot.find({ campaignName, buyerName });
  let removedFrom = 0;
  let removedCall = null;

  for (const snapshot of snapshots) {
    const before = snapshot.calls?.length || 0;
    const remaining = (snapshot.calls || []).filter(
      (call) => !callMatchesKey(call, key, campaignName, buyerName)
    );
    if (remaining.length === before) continue;

    removedCall =
      (snapshot.calls || []).find((call) => callMatchesKey(call, key, campaignName, buyerName)) ||
      removedCall;

    snapshot.calls = remaining;
    snapshot.soldCallCount = remaining.length;
    snapshot.totalCallLogs = remaining.length;
    snapshot.summary = summarizeSoldCalls(remaining, campaignName, buyerName);
    snapshot.syncedAt = snapshot.syncedAt || new Date();
    await snapshot.save();
    removedFrom += 1;
  }

  await ReconciliationExcludedCall.findOneAndUpdate(
    {
      campaignName,
      buyerName,
      callDtRaw,
      inboundPhoneNumber: inboundPhoneNumber || "",
      conversionAmount: Number(conversionAmount) || 0,
    },
    {
      campaignName,
      buyerName,
      callDtRaw,
      inboundPhoneNumber: inboundPhoneNumber || "",
      conversionAmount: Number(conversionAmount) || 0,
      dialedNumber: removedCall?.dialedNumber || "",
      callDt: removedCall?.callDt || "",
      targetName: removedCall?.targetName || "",
      reason: "disputed",
      removedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return {
    removed: true,
    removedFromSnapshots: removedFrom,
    callKey: key,
    phone: normalizePhone(inboundPhoneNumber),
  };
}

export async function getBuyersForCampaign(campaignName, startDate, endDate) {
  const [snapshots, exclusionKeys] = await Promise.all([
    ReconciliationSnapshot.find(overlapQuery({ campaignName, startDate, endDate }))
      .select("buyerName calls summary.calls")
      .lean(),
    getExclusionKeySet(campaignName),
  ]);

  const buyerMap = new Map();
  for (const snapshot of snapshots) {
    const name = snapshot.buyerName;
    if (!name) continue;

    const callsInRange = (snapshot.calls || []).filter(
      (call) =>
        !isCallExcluded(call, campaignName, name, exclusionKeys) &&
        callInDateRange(call, startDate, endDate)
    );
    if (!callsInRange.length && !(Number(snapshot.summary?.calls) > 0)) continue;

    const existing = buyerMap.get(name) || { name, callCount: 0 };
    existing.callCount += callsInRange.length || Number(snapshot.summary?.calls) || 0;
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

  const [snapshots, exclusionKeys] = await Promise.all([
    ReconciliationSnapshot.find({
      startDate: { $lte: range.endDate },
      endDate: { $gte: range.startDate },
    }).lean(),
    getExclusionKeySet(),
  ]);

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
    const callsInRange = (snapshot.calls || []).filter(
      (call) =>
        !isCallExcluded(call, snapshot.campaignName, buyerKey, exclusionKeys) &&
        callInDateRange(call, range.startDate, range.endDate)
    );
    const existingBuyer = buyerMap.get(buyerKey) || { name: buyerKey, callCount: 0 };
    existingBuyer.callCount += callsInRange.length || Number(snapshot.summary?.calls) || 0;
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
