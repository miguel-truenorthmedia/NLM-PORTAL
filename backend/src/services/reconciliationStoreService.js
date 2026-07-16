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

export async function getReconciliationData({ campaignName, buyerName, startDate, endDate }) {
  const query = { startDate, endDate, campaignName };
  if (buyerName) query.buyerName = buyerName;

  const snapshot = await ReconciliationSnapshot.findOne(query).lean();
  if (!snapshot) {
    return {
      dateRange: { startDate, endDate },
      summary: emptySummary(campaignName, buyerName),
      calls: [],
      totalCallLogs: 0,
      soldCallCount: 0,
      syncedAt: null,
    };
  }

  return {
    dateRange: { startDate, endDate },
    summary: snapshot.summary,
    calls: snapshot.calls || [],
    totalCallLogs: snapshot.totalCallLogs || 0,
    soldCallCount: snapshot.soldCallCount || 0,
    syncedAt: snapshot.syncedAt,
  };
}

export async function getBuyersForCampaign(campaignName, startDate, endDate) {
  const snapshots = await ReconciliationSnapshot.find({ startDate, endDate, campaignName })
    .select("buyerName summary.calls")
    .lean();

  return snapshots
    .map((snapshot) => ({
      name: snapshot.buyerName,
      callCount: snapshot.summary?.calls || 0,
    }))
    .sort((a, b) => b.callCount - a.callCount);
}

export async function getReconciliationFilters(startDate, endDate) {
  const defaultRange = getLastWeekRange();
  const range = {
    startDate: startDate || defaultRange.startDate,
    endDate: endDate || defaultRange.endDate,
  };

  const snapshots = await ReconciliationSnapshot.find({
    startDate: range.startDate,
    endDate: range.endDate,
  }).lean();

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

    buyerMap.set(snapshot.buyerName, {
      name: snapshot.buyerName,
      callCount: snapshot.summary?.calls || 0,
    });

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
    weeks: await listSyncedWeeks(),
    defaultRange,
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
      },
    },
    { $sort: { "_id.endDate": -1 } },
  ]);

  return weeks.map((week) => ({
    startDate: week._id.startDate,
    endDate: week._id.endDate,
    lastSyncedAt: week.lastSyncedAt,
  }));
}
