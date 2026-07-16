import { ReconciliationRun } from "../models/ReconciliationRun.js";
import { ReconciliationSnapshot } from "../models/ReconciliationSnapshot.js";
import { hasRingbaConfig } from "../config.js";
import { getLastWeekRange, getWeekRangeWeeksAgo } from "../utils/dateRange.js";
import { listCampaigns } from "./ringbaCampaignService.js";
import {
  getBuyersForCampaign as fetchBuyersFromRingba,
  getReconciliationData as fetchReconciliationFromRingba,
} from "./reconciliationService.js";

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

        // Upsert only — never deletes prior weeks.
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
            summary: data.summary,
            calls: data.calls,
            totalCallLogs: data.totalCallLogs,
            soldCallCount: data.soldCallCount,
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
