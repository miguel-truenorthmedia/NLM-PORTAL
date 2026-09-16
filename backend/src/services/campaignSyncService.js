import { CampaignDailyRow } from "../models/CampaignDailyRow.js";
import { CachedMetadata } from "../models/CachedMetadata.js";
import { hasRingbaConfig } from "../config.js";
import { getYesterdayDate, toLocalDateString } from "../utils/dateRange.js";
import { listAdAccounts } from "./adAccountService.js";
import { listCampaigns } from "./ringbaCampaignService.js";
import { fetchDailyInsightsRollups } from "./ringbaInsightsService.js";
import { hasBigoAdsConfig } from "./bigoClient.js";
import { fetchBigoAdvertiserDayCost, listBigoAccounts } from "./bigoCampaignService.js";
import { upsertAdSpend } from "./campaignSpendService.js";

function eachDateInclusive(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Pull BIGO OpenAPI totalCost per linked ad account/day into campaign spend store.
 * Runs alongside the Ringba revenue sync so Home / Campaign Performance get Cost automatically.
 */
export async function syncBigoSpendForDateRange({ startDate, endDate }) {
  if (!hasBigoAdsConfig()) {
    return { skipped: true, reason: "bigo_not_configured", rowsWritten: 0, errors: [] };
  }

  const adAccounts = (await listAdAccounts()).filter(
    (a) =>
      (a.trafficSourceId || "bigo") === "bigo" &&
      String(a.bigoAccountId || "").trim()
  );
  if (!adAccounts.length) {
    return { skipped: true, reason: "no_bigo_accounts", rowsWritten: 0, errors: [] };
  }

  let timezoneByAdvertiser = new Map();
  try {
    const { accounts } = await listBigoAccounts();
    timezoneByAdvertiser = new Map(
      (accounts || []).map((a) => [String(a.id), Number(a.timezone ?? -5)])
    );
  } catch (error) {
    console.warn("BIGO account list for spend sync failed:", error.message);
  }

  const dates = eachDateInclusive(startDate, endDate);
  let rowsWritten = 0;
  const errors = [];

  for (const account of adAccounts) {
    const advertiserId = String(account.bigoAccountId);
    const timezone = timezoneByAdvertiser.get(advertiserId) ?? -5;

    for (const date of dates) {
      try {
        const amount = await fetchBigoAdvertiserDayCost({
          advertiserId,
          timezone,
          date,
        });
        await upsertAdSpend({
          date,
          adAccountId: account.id,
          amount,
          trafficSourceId: "bigo",
          source: "api",
        });
        rowsWritten += 1;
        // Report API ~1 QPS
        await new Promise((r) => setTimeout(r, 1100));
      } catch (error) {
        errors.push({
          adAccountId: account.id,
          date,
          message: error.message,
        });
      }
    }
  }

  return {
    skipped: false,
    startDate,
    endDate,
    rowsWritten,
    adAccountsProcessed: adAccounts.length,
    errors,
  };
}

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

  let spendSync = { skipped: true, rowsWritten: 0, errors: [] };
  try {
    spendSync = await syncBigoSpendForDateRange({
      startDate: range.startDate,
      endDate: range.endDate,
    });
    if (spendSync.errors?.length) {
      for (const err of spendSync.errors) {
        errors.push({
          adAccountId: err.adAccountId,
          message: `BIGO spend ${err.date}: ${err.message}`,
        });
      }
    }
  } catch (error) {
    errors.push({ adAccountId: "*", message: `BIGO spend sync failed: ${error.message}` });
  }

  return {
    ...range,
    daysBack,
    rowsWritten,
    spendRowsWritten: spendSync.rowsWritten || 0,
    adAccountsProcessed: adAccounts.length,
    errors,
    durationMs: Date.now() - startedAt,
    status:
      errors.length === 0
        ? "success"
        : rowsWritten > 0 || spendSync.rowsWritten > 0
          ? "partial"
          : "failed",
  };
}

/** Pull Ringba metrics (+ BIGO cost) for yesterday — used by the 1 AM ET daily job. */
export async function syncYesterdayCampaignData(referenceDate = new Date()) {
  const yesterday = getYesterdayDate(referenceDate);
  return syncCampaignData({ startDate: yesterday, endDate: yesterday });
}
