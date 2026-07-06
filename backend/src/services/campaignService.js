import { hasRingbaConfig } from "../config.js";

import { getAdAccountById, getAdAccountsFiltered } from "./adAccountService.js";

import {

  getSpendBreakdownForDate,

  getTotalSpendForDate,

  loadSpendRows,

} from "./campaignSpendService.js";

import { listCampaigns } from "./ringbaCampaignService.js";

import { fetchDailyInsightsRollups, fetchInsightsRollup } from "./ringbaInsightsService.js";

import { listTrafficSources } from "./trafficSourceService.js";



function round(value) {

  return Number(value.toFixed(2));

}



function safeDivide(numerator, denominator) {

  if (!denominator) return 0;

  const value = numerator / denominator;

  return Number.isFinite(value) ? value : 0;

}



function buildDailyRow({ date, campaignName, adAccountName, ringba, adSpend, spendBySource = {} }) {

  const profit = ringba.revenue - adSpend;

  const roi = safeDivide(profit, adSpend) * 100;

  return {

    date,

    campaign: campaignName,

    adAccount: adAccountName,

    adSpend: round(adSpend),

    spendBySource,

    revenue: round(ringba.revenue),

    profit: round(profit),

    roi: round(roi),

    calls: ringba.calls,

    convertedCalls: ringba.convertedCalls,

    convertedPercent: round(ringba.convertedPercent),

    rpc: round(safeDivide(ringba.revenue, ringba.convertedCalls)),

    costPerCall: round(safeDivide(adSpend, ringba.calls)),

  };

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



async function resolveTargets({ offerType, campaignId, adAccountId }) {

  if (adAccountId) {

    const account = await getAdAccountById(adAccountId);

    return account ? [account] : [];

  }



  const accounts = await getAdAccountsFiltered({ offerType, campaignId });

  if (accounts.length) return accounts;



  if (campaignId) {

    const campaigns = await listCampaigns();

    const campaign = campaigns.find((item) => item.id === campaignId);

    if (campaign) {

      return [

        {

          id: "all",

          displayName: "All Ad Accounts",

          ringbaAccountTag: "",

          campaignId: campaign.id,

          offerType: campaign.offerType,

          campaignName: campaign.name,

        },

      ];

    }

  }



  return [];

}



export async function getCampaignDaily(startDate, endDate, filters = {}) {

  const { offerType = "", campaignId = "", adAccountId = "" } = filters;

  const spendRows = await loadSpendRows();

  const campaigns = await listCampaigns();

  const targets = await resolveTargets({ offerType, campaignId, adAccountId });



  if (!targets.length) {

    return { summary: buildSummary([]), rows: [], filters: { offerType, campaignId, adAccountId } };

  }



  const rows = [];



  for (const target of targets) {

    const campaign = campaigns.find((item) => item.id === target.campaignId);

    const campaignName = target.campaignName || campaign?.name || "Unknown Campaign";

    const accountTag = target.ringbaAccountTag || "";

    const resolvedCampaignId = target.campaignId || campaignId;

    const accountId = target.id === "all" ? "" : target.id;



    let dailyRingba = [];

    if (hasRingbaConfig) {

      try {

        dailyRingba = await fetchDailyInsightsRollups({

          startDate,

          endDate,

          campaignId: resolvedCampaignId,

          accountTag: accountTag || undefined,

        });

      } catch (error) {

        console.warn("Ringba daily insights failed:", error.message);

      }

    }



    if (!dailyRingba.length) {

      const staticRows = spendRows.filter(

        (row) =>

          row.date >= startDate &&

          row.date <= endDate &&

          (!adAccountId || row.adAccountId === adAccountId)

      );

      const grouped = new Map();

      for (const staticRow of staticRows) {

        const key = `${staticRow.date}|${staticRow.adAccountId}`;

        if (!grouped.has(key)) {

          grouped.set(key, {

            date: staticRow.date,

            adAccountId: staticRow.adAccountId,

            campaign: staticRow.campaign || campaignName,

            adSpend: 0,

            spendBySource: {},

          });

        }

        const entry = grouped.get(key);

        entry.adSpend += staticRow.amount;

        entry.spendBySource[staticRow.trafficSourceId] = round(

          (entry.spendBySource[staticRow.trafficSourceId] || 0) + staticRow.amount

        );

      }



      for (const entry of grouped.values()) {

        const revenue = 0;

        const profit = revenue - entry.adSpend;

        rows.push({

          date: entry.date,

          campaign: entry.campaign,

          adAccount: target.displayName,

          adSpend: round(entry.adSpend),

          spendBySource: entry.spendBySource,

          revenue,

          profit: round(profit),

          roi: round(safeDivide(profit, entry.adSpend) * 100),

          calls: 0,

          convertedCalls: 0,

          convertedPercent: 0,

          rpc: 0,

          costPerCall: round(safeDivide(entry.adSpend, 0)),

        });

      }

      continue;

    }



    for (const day of dailyRingba) {

      const adSpend = getTotalSpendForDate(spendRows, day.date, accountId);

      const spendBySource = getSpendBreakdownForDate(spendRows, day.date, accountId);

      rows.push(

        buildDailyRow({

          date: day.date,

          campaignName,

          adAccountName: target.displayName,

          ringba: day,

          adSpend,

          spendBySource,

        })

      );

    }

  }



  rows.sort((a, b) => a.date.localeCompare(b.date));



  let periodRollup = null;

  if (hasRingbaConfig && targets.length === 1) {

    const target = targets[0];

    try {

      periodRollup = await fetchInsightsRollup({

        startDate,

        endDate,

        campaignId: target.campaignId || campaignId,

        accountTag: target.ringbaAccountTag || undefined,

      });

    } catch (error) {

      console.warn("Ringba period rollup failed:", error.message);

    }

  }



  const summary = buildSummary(rows);

  if (periodRollup) {

    summary.periodConvertedPercent = round(periodRollup.convertedPercent);

    summary.periodCalls = periodRollup.calls;

    summary.periodConvertedCalls = periodRollup.convertedCalls;

    summary.periodRevenue = round(periodRollup.revenue);

  }



  return {

    summary,

    rows,

    filters: { offerType, campaignId, adAccountId },

  };

}



export async function getFilterOptions() {

  const [campaigns, adAccounts, trafficSources] = await Promise.all([

    listCampaigns(),

    getAdAccountsFiltered({}),

    listTrafficSources(),

  ]);



  const offerTypes = [...new Set(campaigns.map((campaign) => campaign.offerType))].sort();



  return { campaigns, adAccounts, offerTypes, trafficSources };

}
