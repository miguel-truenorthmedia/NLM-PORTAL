import { getRingbaCalls } from "./ringbaService.js";
import { getSpendRows } from "./googleSheetsService.js";

function safeDivide(numerator, denominator) {
  if (!denominator) return 0;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : 0;
}

function round(value) {
  return Number(value.toFixed(2));
}

function buildGroupKey(campaign, publisher, adGroup) {
  return `${campaign}|||${publisher}|||${adGroup}`;
}

function ensureAdGroup(map, key, campaign, publisher, adGroup) {
  if (!map[key]) {
    map[key] = {
      campaign,
      publisher,
      adGroup,
      spend: 0,
      calls: 0,
      connectedCalls: 0,
      paidCalls: 0,
      revenue: 0,
      totalDuration: 0,
      cpa: 0,
      rpc: 0,
      roas: 0,
      profit: 0,
      margin: 0,
      avgDuration: 0,
    };
  }
  return map[key];
}

function ensureDay(map, date) {
  if (!map[date]) {
    map[date] = { date, spend: 0, revenue: 0, profit: 0 };
  }
  return map[date];
}

function matchesDimensionFilter(value, filterValue) {
  if (!filterValue) return true;
  return String(value || "Unknown") === filterValue;
}

export async function getDailyKpis(startDate, endDate, filters = {}) {
  const { campaign: campaignFilter = "", publisher: publisherFilter = "" } = filters;
  const [calls, spendRows] = await Promise.all([
    getRingbaCalls(startDate, endDate),
    getSpendRows(startDate, endDate),
  ]);

  const byAdGroupMap = {};
  const byDayMap = {};

  for (const row of spendRows) {
    const adGroup = row.adGroup || "Unknown";
    const campaign = row.campaign || "Unknown";
    const publisher = row.publisher || "Unknown";
    if (!matchesDimensionFilter(campaign, campaignFilter)) continue;
    if (!matchesDimensionFilter(publisher, publisherFilter)) continue;
    const key = buildGroupKey(campaign, publisher, adGroup);
    const group = ensureAdGroup(byAdGroupMap, key, campaign, publisher, adGroup);
    const day = ensureDay(byDayMap, row.date);
    group.spend += row.spend;
    day.spend += row.spend;
  }

  for (const call of calls) {
    const adGroup = call.adGroup || "Unknown";
    const campaign = call.campaign || "Unknown";
    const publisher = call.publisher || "Unknown";
    if (!matchesDimensionFilter(campaign, campaignFilter)) continue;
    if (!matchesDimensionFilter(publisher, publisherFilter)) continue;
    const key = buildGroupKey(campaign, publisher, adGroup);
    const group = ensureAdGroup(byAdGroupMap, key, campaign, publisher, adGroup);
    const day = ensureDay(byDayMap, call.date);
    group.calls += call.calls || 0;
    group.connectedCalls += call.connectedCalls || 0;
    group.paidCalls += call.paidCalls || 0;
    group.revenue += call.revenue;
    group.totalDuration += call.totalDuration || 0;
    day.revenue += call.revenue;
  }

  const byAdGroup = Object.values(byAdGroupMap).map((row) => {
    const profit = row.revenue - row.spend;
    const margin = safeDivide(profit, row.revenue);
    const avgDuration = safeDivide(row.totalDuration, row.calls);
    return {
      campaign: row.campaign,
      publisher: row.publisher,
      adGroup: row.adGroup,
      spend: round(row.spend),
      calls: row.calls,
      connectedCalls: row.connectedCalls,
      paidCalls: row.paidCalls,
      revenue: round(row.revenue),
      cpa: round(safeDivide(row.spend, row.paidCalls)),
      rpc: round(safeDivide(row.revenue, row.calls)),
      roas: round(safeDivide(row.revenue, row.spend)),
      profit: round(profit),
      margin: round(margin),
      avgDuration: round(avgDuration),
    };
  })
  .filter((row) => row.calls > 0 || row.connectedCalls > 0 || row.paidCalls > 0 || row.revenue > 0);

  const byDay = Object.values(byDayMap)
    .map((row) => {
      const profit = row.revenue - row.spend;
      return {
        date: row.date,
        spend: round(row.spend),
        revenue: round(row.revenue),
        profit: round(profit),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const summary = byAdGroup.reduce(
    (acc, row) => {
      acc.spend += row.spend;
      acc.revenue += row.revenue;
      acc.profit += row.profit;
      acc.calls += row.calls;
      acc.connectedCalls += row.connectedCalls;
      acc.paidCalls += row.paidCalls;
      return acc;
    },
    {
      spend: 0,
      revenue: 0,
      profit: 0,
      roas: 0,
      calls: 0,
      connectedCalls: 0,
      paidCalls: 0,
    }
  );

  summary.spend = round(summary.spend);
  summary.revenue = round(summary.revenue);
  summary.profit = round(summary.profit);
  summary.roas = round(safeDivide(summary.revenue, summary.spend));

  return { summary, byAdGroup, byDay };
}
