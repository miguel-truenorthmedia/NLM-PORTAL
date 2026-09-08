import { ReconciliationExcludedCall } from "../models/ReconciliationExcludedCall.js";
import { ReconciliationRun } from "../models/ReconciliationRun.js";
import { ReconciliationSnapshot } from "../models/ReconciliationSnapshot.js";
import { hasRingbaConfig } from "../config.js";
import { getLastWeekRange, getWeekRangeWeeksAgo } from "../utils/dateRange.js";
import { buildCallKey } from "../utils/reconciliationCallKey.js";
import { listCampaigns } from "./ringbaCampaignService.js";
import {
  getBuyersForCampaign as fetchBuyersFromRingba,
  getReconciliationData as fetchReconciliationFromRingba,
} from "./reconciliationService.js";

async function loadExclusionKeySet() {
  const exclusions = await ReconciliationExcludedCall.find({}).lean();
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

function dropExcludedCalls(calls, campaignName, buyerName, exclusionKeys) {
  if (!exclusionKeys?.size) return calls || [];
  return (calls || []).filter(
    (call) =>
      !exclusionKeys.has(
        buildCallKey({
          campaignName,
          buyerName,
          callDtRaw: call.callDtRaw,
          inboundPhoneNumber: call.inboundPhoneNumber,
          conversionAmount: call.conversionAmount,
        })
      )
  );
}

function summarizeSoldCalls(soldCalls, campaignName, buyerName) {
  const revenue = soldCalls.reduce((sum, call) => sum + (Number(call.conversionAmount) || 0), 0);
  const payout = soldCalls.reduce((sum, call) => sum + (Number(call.payoutAmount) || 0), 0);
  const convertedCalls = soldCalls.length;
  const profit = revenue - payout;
  const round = (value) => Number((Number(value) || 0).toFixed(2));
  const safeDivide = (n, d) => (d ? (Number.isFinite(n / d) ? n / d : 0) : 0);

  return {
    campaign: campaignName,
    buyer: buyerName || "",
    calls: convertedCalls,
    convertedCalls,
    rpc: round(safeDivide(revenue, convertedCalls)),
    revenue: round(revenue),
    payout: round(payout),
    profit: round(profit),
    convertedPercent: round(safeDivide(convertedCalls, convertedCalls) * 100),
  };
}

export async function syncReconciliationWeek({ startDate, endDate } = getLastWeekRange()) {
  if (!hasRingbaConfig) {
    throw new Error("Ringba credentials are not configured");
  }

  const startedAt = Date.now();
  const run = await ReconciliationRun.create({
    startDate,
    endDate,
    status: "running",
    startedAt: new Date(startedAt),
    campaignsProcessed: 0,
    snapshotsWritten: 0,
    syncErrors: [],
  });

  const campaigns = await listCampaigns();
  const exclusionKeys = await loadExclusionKeySet();
  let snapshotsWritten = 0;
  const errors = [];

  for (const campaign of campaigns) {
    let buyers = [];
    try {
      buyers = await fetchBuyersFromRingba(campaign.name, startDate, endDate);
    } catch (error) {
      errors.push({
        campaignName: campaign.name,
        buyerName: null,
        message: `Failed to list buyers: ${error.message}`,
      });
      continue;
    }

    for (const buyer of buyers) {
      try {
        const data = await fetchReconciliationFromRingba({
          campaignName: campaign.name,
          buyerName: buyer.name,
          startDate,
          endDate,
        });

        const calls = dropExcludedCalls(data.calls, campaign.name, buyer.name, exclusionKeys);
        const summary =
          calls.length === (data.calls || []).length
            ? data.summary
            : summarizeSoldCalls(calls, campaign.name, buyer.name);

        // Upsert only — never deletes prior weeks. Exclusions survive re-sync.
        await ReconciliationSnapshot.findOneAndUpdate(
          {
            startDate,
            endDate,
            campaignName: campaign.name,
            buyerName: buyer.name,
          },
          {
            startDate,
            endDate,
            campaignId: campaign.id,
            campaignName: campaign.name,
            buyerName: buyer.name,
            summary,
            calls,
            totalCallLogs: calls.length,
            soldCallCount: calls.length,
            syncedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        snapshotsWritten += 1;
      } catch (error) {
        errors.push({
          campaignName: campaign.name,
          buyerName: buyer.name,
          message: error.message,
        });
      }
    }
  }

  const durationMs = Date.now() - startedAt;
  const status = errors.length === 0 ? "success" : snapshotsWritten > 0 ? "partial" : "failed";

  await ReconciliationRun.findByIdAndUpdate(run._id, {
    status,
    completedAt: new Date(),
    campaignsProcessed: campaigns.length,
    snapshotsWritten,
    syncErrors: errors,
    durationMs,
  });

  return {
    startDate,
    endDate,
    status,
    campaignsProcessed: campaigns.length,
    snapshotsWritten,
    errors,
    durationMs,
  };
}

export async function syncLastWeekReconciliation(referenceDate = new Date()) {
  const { startDate, endDate } = getLastWeekRange(referenceDate);
  return syncReconciliationWeek({ startDate, endDate });
}

/**
 * Sync multiple past business weeks into MongoDB.
 * Existing weeks are updated in place — older weeks are never deleted.
 */
export async function syncReconciliationHistory(weekCount = 8, referenceDate = new Date()) {
  const count = Math.max(1, Math.min(Number(weekCount) || 8, 26));
  const results = [];

  for (let weeksAgo = 0; weeksAgo < count; weeksAgo += 1) {
    const { startDate, endDate } = getWeekRangeWeeksAgo(weeksAgo, referenceDate);
    console.log(`Syncing reconciliation week ${weeksAgo + 1}/${count}: ${startDate} → ${endDate}`);
    results.push(await syncReconciliationWeek({ startDate, endDate }));
  }

  return {
    weekCount: count,
    weeks: results.map((result) => ({
      startDate: result.startDate,
      endDate: result.endDate,
      status: result.status,
      snapshotsWritten: result.snapshotsWritten,
      errors: result.errors.length,
    })),
    snapshotsWritten: results.reduce((sum, result) => sum + result.snapshotsWritten, 0),
    status: results.every((result) => result.status === "success")
      ? "success"
      : results.some((result) => result.snapshotsWritten > 0)
        ? "partial"
        : "failed",
  };
}
