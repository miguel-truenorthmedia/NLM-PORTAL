import { CampaignDailyRow } from "../models/CampaignDailyRow.js";
import { CachedMetadata } from "../models/CachedMetadata.js";
import { filterEmptyCampaignRows } from "../utils/campaignRowUtils.js";
import { getAdAccountsFiltered } from "./adAccountService.js";
import {
  getSpendBreakdownForDate,
  getTotalSpendForDate,
  loadSpendRows,
} from "./campaignSpendService.js";
import { listTrafficSources } from "./trafficSourceService.js";

function round(value) {
  return Number(value.toFixed(2));
}

function safeDivide(numerator, denominator) {
  if (!denominator) return 0;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : 0;
}

function enrichRow(row, spendRows) {
  const adSpend = getTotalSpendForDate(spendRows, row.date, row.adAccountId);
  const spendBySource = getSpendBreakdownForDate(spendRows, row.date, row.adAccountId);
  const profit = row.revenue - adSpend;
  return {
    date: row.date,
    campaign: row.campaign,
    adAccount: row.adAccount,
    adSpend: round(adSpend),
    spendBySource,
    revenue: round(row.revenue),
    profit: round(profit),
    roi: round(safeDivide(profit, adSpend) * 100),
    calls: row.calls,
    convertedCalls: row.convertedCalls,
    convertedPercent: round(row.convertedPercent),
    rpc: round(safeDivide(row.revenue, row.convertedCalls)),
    costPerCall: round(safeDivide(adSpend, row.calls)),
  };
}

function buildSpendOnlyRows(storedRows, spendRows, filters, adAccounts, startDate, endDate) {
  const { offerType = "", campaignId = "", adAccountId = "" } = filters;
  const existingKeys = new Set(storedRows.map((row) => `${row.date}|${row.adAccountId}`));
  const accountMap = new Map(adAccounts.map((account) => [account.id, account]));
  const synthetic = [];

  for (const spend of spendRows) {
    if (spend.date < startDate || spend.date > endDate) continue;

    const key = `${spend.date}|${spend.adAccountId}`;
    if (existingKeys.has(key)) continue;

    const account = accountMap.get(spend.adAccountId);
    if (!account) continue;
    if (campaignId && account.campaignId !== campaignId) continue;
    if (adAccountId && account.id !== adAccountId) continue;
    if (offerType && account.offerType !== offerType) continue;

    synthetic.push({
      date: spend.date,
      campaignId: account.campaignId,
      adAccountId: account.id,
      offerType: account.offerType,
      campaign: spend.campaign || account.displayName,
      adAccount: account.displayName,
      calls: 0,
      convertedCalls: 0,
      convertedPercent: 0,
      revenue: 0,
    });
    existingKeys.add(key);
  }

  return synthetic;
}

function buildSummary(rows) {
  const totalSpend = rows.reduce((sum, row) => sum + row.adSpend, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
  const avgRoi = rows.length ? rows.reduce((sum, row) => sum + row.roi, 0) / rows.length : 0;
  const avgConvertedPercent = rows.length
    ? rows.reduce((sum, row) => sum + row.convertedPercent, 0) / rows.length
    : 0;

  return {
    totalSpend: round(totalSpend),
    totalRevenue: round(totalRevenue),
    totalProfit: round(totalProfit),
    avgRoi: round(avgRoi),
    avgConvertedPercent: round(avgConvertedPercent),
    totalCalls: rows.reduce((sum, row) => sum + row.calls, 0),
    totalConvertedCalls: rows.reduce((sum, row) => sum + row.convertedCalls, 0),
  };
}

export async function getCampaignDailyFromStore(startDate, endDate, filters = {}) {
  const { offerType = "", campaignId = "", adAccountId = "" } = filters;
  const query = {
    date: { $gte: startDate, $lte: endDate },
  };

  if (campaignId) query.campaignId = campaignId;
  if (adAccountId) query.adAccountId = adAccountId;
  if (offerType) query.offerType = offerType;

  const [storedRows, spendRows, meta, adAccounts] = await Promise.all([
    CampaignDailyRow.find(query).sort({ date: 1 }).lean(),
    loadSpendRows(),
    CachedMetadata.findOne({ key: "campaign-filters" }).lean(),
    getAdAccountsFiltered({ offerType, campaignId, adAccountId }),
  ]);

  const spendOnlyRows = buildSpendOnlyRows(
    storedRows,
    spendRows,
    { offerType, campaignId, adAccountId },
    adAccounts,
    startDate,
    endDate
  );
  const allRows = [...storedRows, ...spendOnlyRows];

  const rows = filterEmptyCampaignRows(allRows.map((row) => enrichRow(row, spendRows)));
  const summary = buildSummary(rows);

  if (rows.length === 1) {
    summary.periodConvertedPercent = rows[0].convertedPercent;
    summary.periodCalls = rows[0].calls;
    summary.periodConvertedCalls = rows[0].convertedCalls;
    summary.periodRevenue = rows[0].revenue;
  }

  return {
    summary,
    rows,
    filters: { offerType, campaignId, adAccountId },
    syncedAt: meta?.syncedAt || null,
    dataSource: "mongodb",
  };
}

export async function getFilterOptionsFromStore() {
  const [meta, adAccounts, trafficSources] = await Promise.all([
    CachedMetadata.findOne({ key: "campaign-filters" }).lean(),
    getAdAccountsFiltered({}),
    listTrafficSources(),
  ]);

  const campaigns = meta?.data?.campaigns || [];
  const offerTypes = [...new Set(campaigns.map((campaign) => campaign.offerType))].sort();

  return {
    campaigns,
    adAccounts,
    offerTypes,
    trafficSources,
    lastSyncedAt: meta?.syncedAt || null,
    dataSource: "mongodb",
  };
}
