import { CampaignDailyRow } from "../models/CampaignDailyRow.js";
import { CachedMetadata } from "../models/CachedMetadata.js";
import { hasRingbaConfig } from "../config.js";
import { getYesterdayDate, toLocalDateString } from "../utils/dateRange.js";
import { listAdAccounts } from "./adAccountService.js";
import { listCampaigns } from "./ringbaCampaignService.js";
import { fetchDailyInsightsRollups } from "./ringbaInsightsService.js";

export function getDaysBackRange(daysBack = 60) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - (daysBack - 1));
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
  };
}

export async function syncCampaignData({ daysBack = 60, startDate, endDate } = {}) {
  if (!hasRingbaConfig) {
    throw new Error("Ringba credentials are not configured");
  }

  const range = startDate && endDate ? { startDate, endDate } : getDaysBackRange(daysBack);
  const startedAt = Date.now();
  const adAccounts = await listAdAccounts();
  const campaigns = await listCampaigns();
  let rowsWritten = 0;
  const errors = [];

  await CachedMetadata.findOneAndUpdate(
    { key: "campaign-filters" },
    { key: "campaign-filters", data: { campaigns }, syncedAt: new Date() },
    { upsert: true, new: true }
  );

  for (const account of adAccounts) {
    const campaign = campaigns.find((item) => item.id === account.campaignId);
    const campaignName = campaign?.name || account.displayName;

    try {
      const dailyRingba = await fetchDailyInsightsRollups({
        startDate: range.startDate,
        endDate: range.endDate,
        campaignId: account.campaignId,
        accountTag: account.ringbaAccountTag,
      });

      if (!dailyRingba.length) {
        errors.push({
          adAccountId: account.id,
          message: "No Ringba data returned for date range",
        });
        continue;
      }

      for (const day of dailyRingba) {
        await CampaignDailyRow.findOneAndUpdate(
          {
            date: day.date,
            campaignId: account.campaignId,
            adAccountId: account.id,
          },
          {
            $set: {
              calls: day.calls,
              convertedCalls: day.convertedCalls,
              convertedPercent: day.convertedPercent,
              revenue: day.revenue,
              syncedAt: new Date(),
              offerType: account.offerType,
              campaign: campaignName,
              adAccount: account.displayName,
            },
            $setOnInsert: {
              date: day.date,
              campaignId: account.campaignId,
              adAccountId: account.id,
            },
          },
          { upsert: true, new: true }
        );
        rowsWritten += 1;
      }
    } catch (error) {
      errors.push({
        adAccountId: account.id,
        message: error.message,
      });
    }
  }

  return {
    ...range,
    daysBack,
    rowsWritten,
    adAccountsProcessed: adAccounts.length,
    errors,
    durationMs: Date.now() - startedAt,
    status: errors.length === 0 ? "success" : rowsWritten > 0 ? "partial" : "failed",
  };
}

/** Pull Ringba metrics for yesterday only — used by the 1 AM ET daily job. */
export async function syncYesterdayCampaignData(referenceDate = new Date()) {
  const yesterday = getYesterdayDate(referenceDate);
  return syncCampaignData({ startDate: yesterday, endDate: yesterday });
}
