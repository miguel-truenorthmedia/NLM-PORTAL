import { hasMongoConfig } from "../config.js";
import { CampaignDailyRow } from "../models/CampaignDailyRow.js";
import {
  categoryForPlatform,
  COMPANY_EXPENSE_SEED,
  sheetExternalId,
} from "../data/companyExpenseSeed.js";
import { PnLExpenseExclusion } from "../models/PnLExpenseExclusion.js";
import {
  PNL_EXPENSE_CATEGORIES,
  PNL_EXPENSE_SOURCES,
  PnLExpense,
} from "../models/PnLExpense.js";
import { toEasternDateString } from "../utils/dateRange.js";
import { getCampaignDailyFromStore } from "./campaignStoreService.js";
import { getCampaignDaily } from "./campaignService.js";
import { fetchRingbaCcTransactions } from "./ringbaBillingService.js";

function requireMongo() {
  if (!hasMongoConfig) {
    throw new Error("MongoDB is required for P&L");
  }
}

function round(value) {
  return Number((Number(value) || 0).toFixed(2));
}

function safeDivide(numerator, denominator) {
  if (!denominator) return 0;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : 0;
}

function actorFromUser(user) {
  if (!user) return { userId: "", name: "", email: "" };
  return {
    userId: String(user.id || user._id || ""),
    name: String(user.name || user.email || "Unknown").trim(),
    email: String(user.email || "").trim().toLowerCase(),
  };
}

/** Parse YYYY-MM → month bounds */
export function monthBounds(month) {
  const match = String(month || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error("month must be YYYY-MM");
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) throw new Error("month must be YYYY-MM");

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    month: `${year}-${pad(monthIndex + 1)}`,
    startDate: `${year}-${pad(monthIndex + 1)}-01`,
    endDate: `${year}-${pad(monthIndex + 1)}-${pad(end.getDate())}`,
    label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

export function shiftMonth(month, delta) {
  const { month: normalized } = monthBounds(month);
  const [year, mon] = normalized.split("-").map(Number);
  const date = new Date(year, mon - 1 + delta, 1);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function currentMonthKey(reference = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${reference.getFullYear()}-${pad(reference.getMonth() + 1)}`;
}

function pctChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return round(((current - previous) / Math.abs(previous)) * 100);
}

function normalizeExpense(doc) {
  return {
    id: String(doc._id),
    month: doc.month || "",
    date: doc.date || "",
    category: doc.category || "Other",
    platform: doc.platform || "",
    description: doc.description || "",
    amount: round(doc.amount),
    paymentMethod: doc.paymentMethod || "",
    receiptSaved: Boolean(doc.receiptSaved),
    source: doc.source || "manual",
    externalId: doc.externalId || "",
    historicalOnly: Boolean(doc.historicalOnly),
    notes: doc.notes || "",
    createdBy: doc.createdBy || { userId: "", name: "", email: "" },
    updatedBy: doc.updatedBy || { userId: "", name: "", email: "" },
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

async function getCampaignMonthTotals(startDate, endDate) {
  const result = hasMongoConfig
    ? await getCampaignDailyFromStore(startDate, endDate, {})
    : await getCampaignDaily(startDate, endDate, {});

  const summary = result.summary || {};
  return {
    revenue: round(summary.totalRevenue),
    adSpend: round(summary.totalSpend),
    /** Same Campaign Performance profit column: revenue − ad spend */
    campaignProfit: round(summary.totalProfit),
    calls: Number(summary.totalCalls) || 0,
    convertedCalls: Number(summary.totalConvertedCalls) || 0,
    avgRoi: round(summary.avgRoi),
    dataSource: result.dataSource || (hasMongoConfig ? "mongodb" : "ringba"),
  };
}

async function getExpensesForMonth(month) {
  const rows = await PnLExpense.find({
    month,
    historicalOnly: { $ne: true },
  })
    .sort({ date: 1, createdAt: 1 })
    .lean();
  return rows.map(normalizeExpense);
}

function buildMonthStatement(bounds, campaign, expenses) {
  const operatingExpenses = round(expenses.reduce((sum, row) => sum + row.amount, 0));
  const netProfit = round(campaign.campaignProfit - operatingExpenses);
  const byCategory = {};
  for (const category of PNL_EXPENSE_CATEGORIES) byCategory[category] = 0;
  for (const row of expenses) {
    byCategory[row.category] = round((byCategory[row.category] || 0) + row.amount);
  }

  return {
    month: bounds.month,
    label: bounds.label,
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    revenue: campaign.revenue,
    adSpend: campaign.adSpend,
    campaignProfit: campaign.campaignProfit,
    grossMargin: round(safeDivide(campaign.campaignProfit, campaign.revenue) * 100),
    operatingExpenses,
    netProfit,
    /** Net profit ÷ ad spend — $ returned (or lost) per $1 of ad spend */
    netMargin: round(safeDivide(netProfit, campaign.adSpend) * 100),
    calls: campaign.calls,
    convertedCalls: campaign.convertedCalls,
    avgRoi: campaign.avgRoi,
    expensesByCategory: byCategory,
    expenseCount: expenses.length,
  };
}

function withComparison(current, previous) {
  const keys = ["revenue", "adSpend", "campaignProfit", "operatingExpenses", "netProfit", "calls", "convertedCalls"];
  const changes = {};
  for (const key of keys) {
    const cur = current[key] || 0;
    const prev = previous?.[key] || 0;
    changes[key] = {
      current: cur,
      previous: prev,
      delta: round(cur - prev),
      pct: pctChange(cur, prev),
    };
  }
  return changes;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * For an incomplete selected month (usually the current month), compare only through
 * the same calendar day last month — not a full prior month vs partial current.
 * Prefer the latest day that actually has campaign rows so we match available data.
 */
function comparableAsOf(selected, asOfDate) {
  const end = String(asOfDate || selected.endDate);
  const asOfDay = Number(end.slice(8, 10));
  const monthLastDay = Number(selected.endDate.slice(8, 10));
  return {
    partial: end < selected.endDate,
    asOfDay,
    currentEndDate: end,
    monthLastDay,
  };
}

async function resolveComparableAsOf(selected) {
  const todayEastern = toEasternDateString();
  const todayMonth = todayEastern.slice(0, 7);

  // Completed past months → full month vs full month
  if (selected.month < todayMonth) {
    return comparableAsOf(selected, selected.endDate);
  }

  const latestRow = await CampaignDailyRow.findOne({
    date: { $gte: selected.startDate, $lte: selected.endDate },
  })
    .sort({ date: -1 })
    .select({ date: 1 })
    .lean();

  // Use latest synced campaign day in this month (falls back to Eastern today)
  let asOfDate = latestRow?.date || todayEastern;
  if (asOfDate > selected.endDate) asOfDate = selected.endDate;
  return comparableAsOf(selected, asOfDate);
}

function priorComparableEndDate(previous, asOfDay) {
  const monthLastDay = Number(previous.endDate.slice(8, 10));
  const day = Math.min(asOfDay, monthLastDay);
  return `${previous.month}-${pad2(day)}`;
}

function expensesThroughDate(expenses, endDate) {
  return (expenses || []).filter((row) => !row.date || row.date <= endDate);
}

/**
 * Full P&L overview for a month: statement, MoM comparison, trend, expenses.
 */
export async function getPnLOverview({ month } = {}) {
  requireMongo();
  const selected = monthBounds(month || currentMonthKey());
  const previousKey = shiftMonth(selected.month, -1);
  const previous = monthBounds(previousKey);
  const asOf = await resolveComparableAsOf(selected);
  const priorEndDate = priorComparableEndDate(previous, asOf.asOfDay);

  const trendMonths = [];
  for (let i = 5; i >= 0; i -= 1) {
    trendMonths.push(monthBounds(shiftMonth(selected.month, -i)));
  }

  const [currentCampaign, previousCampaign, currentExpensesAll, previousExpensesAll, ...trendCampaigns] =
    await Promise.all([
      getCampaignMonthTotals(selected.startDate, asOf.currentEndDate),
      getCampaignMonthTotals(previous.startDate, priorEndDate),
      getExpensesForMonth(selected.month),
      getExpensesForMonth(previous.month),
      ...trendMonths.map((bounds) => getCampaignMonthTotals(bounds.startDate, bounds.endDate)),
    ]);

  const currentExpenses = expensesThroughDate(currentExpensesAll, asOf.currentEndDate);
  const previousExpenses = expensesThroughDate(previousExpensesAll, priorEndDate);
  const trendExpenseLists = await Promise.all(trendMonths.map((bounds) => getExpensesForMonth(bounds.month)));

  const currentBounds = {
    ...selected,
    endDate: asOf.currentEndDate,
    label: asOf.partial ? `${selected.label} (through day ${asOf.asOfDay})` : selected.label,
  };
  const priorBounds = {
    ...previous,
    endDate: priorEndDate,
    label: asOf.partial
      ? `${previous.label} (days 1–${Number(priorEndDate.slice(8, 10))})`
      : previous.label,
  };

  const current = buildMonthStatement(currentBounds, currentCampaign, currentExpenses);
  const prior = buildMonthStatement(priorBounds, previousCampaign, previousExpenses);

  const trend = trendMonths.map((bounds, index) => {
    const statement = buildMonthStatement(bounds, trendCampaigns[index], trendExpenseLists[index]);
    return {
      month: statement.month,
      label: bounds.label.replace(/ \d{4}$/, ""), // "Sep"
      fullLabel: bounds.label,
      revenue: statement.revenue,
      adSpend: statement.adSpend,
      campaignProfit: statement.campaignProfit,
      operatingExpenses: statement.operatingExpenses,
      netProfit: statement.netProfit,
    };
  });

  return {
    month: selected.month,
    current,
    previous: prior,
    comparison: withComparison(current, prior),
    trend,
    expenses: currentExpenses,
    meta: {
      categories: PNL_EXPENSE_CATEGORIES,
      sources: PNL_EXPENSE_SOURCES,
      dataSource: currentCampaign.dataSource,
      betterThanLastMonth: current.netProfit > prior.netProfit,
      partialMonth: asOf.partial,
      comparisonLabel: asOf.partial ? "vs same days last month" : "vs last month",
      asOfDay: asOf.asOfDay,
      currentEndDate: asOf.currentEndDate,
      priorEndDate,
    },
  };
}

/**
 * Lifetime / overall company P&L (all months combined).
 */
export async function getPnLHistorical() {
  requireMongo();
  const today = toEasternDateString();
  const thisMonth = currentMonthKey();

  const [earliestCampaign, earliestExpense, allExpenses] = await Promise.all([
    CampaignDailyRow.findOne({}).sort({ date: 1 }).select({ date: 1 }).lean(),
    PnLExpense.findOne({}).sort({ month: 1, date: 1 }).select({ month: 1, date: 1 }).lean(),
    PnLExpense.find({}).sort({ date: 1, createdAt: 1 }).lean(),
  ]);

  const expenseMonths = allExpenses.map((row) => row.month).filter(Boolean);
  const startCandidates = [
    earliestCampaign?.date?.slice(0, 7),
    earliestExpense?.month,
    expenseMonths[0],
    "2025-09",
  ].filter(Boolean);
  startCandidates.sort();
  const startMonth = startCandidates[0] || thisMonth;

  const months = [];
  let cursor = startMonth;
  while (cursor <= thisMonth) {
    months.push(monthBounds(cursor));
    cursor = shiftMonth(cursor, 1);
    if (months.length > 60) break;
  }

  const startDate = months[0]?.startDate || `${startMonth}-01`;
  const endDate = today;

  const [lifetimeCampaign, ...monthCampaigns] = await Promise.all([
    getCampaignMonthTotals(startDate, endDate),
    ...months.map((bounds) => getCampaignMonthTotals(bounds.startDate, bounds.endDate)),
  ]);

  const expensesByMonth = new Map();
  for (const row of allExpenses) {
    const key = row.month || String(row.date || "").slice(0, 7);
    if (!expensesByMonth.has(key)) expensesByMonth.set(key, []);
    expensesByMonth.get(key).push(row);
  }

  const lifetimeExpenses = allExpenses.map(normalizeExpense);
  const lifetimeBounds = {
    month: "lifetime",
    label: "All time",
    startDate,
    endDate,
  };
  const overall = buildMonthStatement(lifetimeBounds, lifetimeCampaign, lifetimeExpenses);

  const trend = months.map((bounds, index) => {
    const monthExpenses = (expensesByMonth.get(bounds.month) || []).map(normalizeExpense);
    const statement = buildMonthStatement(bounds, monthCampaigns[index], monthExpenses);
    const [year, mon] = bounds.month.split("-");
    const short = new Date(Number(year), Number(mon) - 1, 1).toLocaleDateString("en-US", {
      month: "short",
    });
    return {
      month: statement.month,
      label: `${short} '${String(year).slice(2)}`,
      fullLabel: bounds.label,
      revenue: statement.revenue,
      adSpend: statement.adSpend,
      campaignProfit: statement.campaignProfit,
      operatingExpenses: statement.operatingExpenses,
      netProfit: statement.netProfit,
    };
  });

  const byPlatform = {};
  for (const row of lifetimeExpenses) {
    const key = row.platform || row.category || "Other";
    byPlatform[key] = round((byPlatform[key] || 0) + row.amount);
  }

  return {
    overall,
    range: { startDate, endDate, startMonth, endMonth: thisMonth },
    trend,
    expensesByCategory: overall.expensesByCategory,
    expensesByPlatform: byPlatform,
    expenseCount: lifetimeExpenses.length,
    meta: {
      categories: PNL_EXPENSE_CATEGORIES,
      dataSource: lifetimeCampaign.dataSource,
      monthsCovered: months.length,
    },
  };
}

export async function listPnLExpenses({ month } = {}) {
  requireMongo();
  if (month) monthBounds(month);
  const query = month ? { month } : {};
  const rows = await PnLExpense.find(query).sort({ month: -1, date: 1, createdAt: -1 }).lean();
  return { expenses: rows.map(normalizeExpense), meta: { categories: PNL_EXPENSE_CATEGORIES } };
}

export async function createPnLExpense(body, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const month = String(body.month || "").trim() || currentMonthKey();
  monthBounds(month);

  const description = String(body.description || "").trim();
  if (!description) throw new Error("Description is required");

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Amount must be a valid number >= 0");

  const category = String(body.category || "Other").trim();
  if (!PNL_EXPENSE_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category. Allowed: ${PNL_EXPENSE_CATEGORIES.join(", ")}`);
  }

  const source = String(body.source || "manual").trim();
  if (!PNL_EXPENSE_SOURCES.includes(source)) {
    throw new Error(`Invalid source. Allowed: ${PNL_EXPENSE_SOURCES.join(", ")}`);
  }

  const externalId = String(body.externalId || "").trim();
  if (externalId) {
    await PnLExpenseExclusion.deleteOne({ externalId });
  }

  const created = await PnLExpense.create({
    month,
    date: String(body.date || "").trim(),
    category,
    platform: String(body.platform || "").trim(),
    description,
    amount: round(amount),
    paymentMethod: String(body.paymentMethod || "").trim(),
    receiptSaved: Boolean(body.receiptSaved),
    source,
    externalId,
    historicalOnly: Boolean(body.historicalOnly),
    notes: String(body.notes || "").trim(),
    createdBy: actor,
    updatedBy: actor,
  });

  return normalizeExpense(created.toObject());
}

export async function updatePnLExpense(id, body, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const existing = await PnLExpense.findById(id);
  if (!existing) throw new Error("Expense not found");

  if (body.month !== undefined) {
    const month = String(body.month || "").trim();
    monthBounds(month);
    existing.month = month;
  }
  if (body.date !== undefined) existing.date = String(body.date || "").trim();
  if (body.description !== undefined) {
    const description = String(body.description || "").trim();
    if (!description) throw new Error("Description is required");
    existing.description = description;
  }
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Amount must be a valid number >= 0");
    existing.amount = round(amount);
  }
  if (body.category !== undefined) {
    const category = String(body.category || "").trim();
    if (!PNL_EXPENSE_CATEGORIES.includes(category)) {
      throw new Error(`Invalid category. Allowed: ${PNL_EXPENSE_CATEGORIES.join(", ")}`);
    }
    existing.category = category;
  }
  if (body.platform !== undefined) existing.platform = String(body.platform || "").trim();
  if (body.paymentMethod !== undefined) existing.paymentMethod = String(body.paymentMethod || "").trim();
  if (body.receiptSaved !== undefined) existing.receiptSaved = Boolean(body.receiptSaved);
  if (body.notes !== undefined) existing.notes = String(body.notes || "").trim();

  existing.updatedBy = actor;
  await existing.save();
  return normalizeExpense(existing.toObject());
}

export async function deletePnLExpense(id, user, { hard = false } = {}) {
  requireMongo();
  const existing = await PnLExpense.findById(id);
  if (!existing) throw new Error("Expense not found");

  if (!hard) {
    // Soft-hide: remove from monthly P&L only; keep on P&L Historical
    existing.historicalOnly = true;
    existing.updatedBy = actorFromUser(user);
    await existing.save();

    return {
      deleted: false,
      hiddenFromMonthly: true,
      id: String(existing._id),
      expense: normalizeExpense(existing.toObject()),
    };
  }

  const externalId = String(existing.externalId || "").trim();
  if (externalId) {
    await PnLExpenseExclusion.findOneAndUpdate(
      { externalId },
      {
        externalId,
        source: existing.source || "",
        description: existing.description || "",
        deletedBy: actorFromUser(user),
      },
      { upsert: true, new: true }
    );
  }

  await PnLExpense.deleteOne({ _id: existing._id });

  return {
    deleted: true,
    hiddenFromMonthly: false,
    id: String(existing._id),
  };
}

function ringbaTxnAmount(row) {
  const raw = row?.amount?.amount ?? row?.amount;
  const value = Number(raw);
  return Number.isFinite(value) ? round(value) : 0;
}

function shouldImportRingbaTxn(row) {
  if (!row || row.success === false) return false;
  const amount = ringbaTxnAmount(row);
  if (amount <= 0.05) return false; // skip card verification pennies
  const description = String(row.description || row.name || "").trim();
  if (!description) return false;
  return true;
}

/**
 * Pull Ringba Billing → Transaction History into PnL expenses (source=ringba).
 * Dedupes on externalId = refId.
 */
export async function syncRingbaBillingExpenses({ monthsBack = 5 } = {}, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const transactions = await fetchRingbaCcTransactions({ monthsBack });

  let imported = 0;
  let skipped = 0;
  let unchanged = 0;
  const byMonth = {};

  for (const row of transactions) {
    if (!shouldImportRingbaTxn(row)) {
      skipped += 1;
      continue;
    }

    const externalId = String(row.refId || "").trim();
    if (!externalId) {
      skipped += 1;
      continue;
    }

    const excluded = await PnLExpenseExclusion.findOne({ externalId }).lean();
    if (excluded) {
      skipped += 1;
      continue;
    }

    const amount = ringbaTxnAmount(row);
    const date = toEasternDateString(new Date(row.dtStamp));
    const month = date.slice(0, 7);
    const description = String(row.description || row.name || "Ringba charge").trim();
    const cardHint = row.cC_Last_4 ? `Card x${row.cC_Last_4}` : "";
    const notes = [row.name, cardHint, row.cardType].filter(Boolean).join(" · ");

    const existing = await PnLExpense.findOne({ source: "ringba", externalId });
    if (existing) {
      let changed = false;
      if (existing.amount !== amount) {
        existing.amount = amount;
        changed = true;
      }
      if (existing.description !== description) {
        existing.description = description;
        changed = true;
      }
      if (existing.date !== date) {
        existing.date = date;
        existing.month = month;
        changed = true;
      }
      if (changed) {
        existing.updatedBy = actor;
        await existing.save();
        imported += 1;
      } else {
        unchanged += 1;
      }
      byMonth[month] = round((byMonth[month] || 0) + amount);
      continue;
    }

    await PnLExpense.create({
      month,
      date,
      category: "Ringba",
      platform: "Ringba",
      description,
      amount,
      paymentMethod: cardHint || "",
      receiptSaved: false,
      source: "ringba",
      externalId,
      notes,
      createdBy: actor,
      updatedBy: actor,
    });
    imported += 1;
    byMonth[month] = round((byMonth[month] || 0) + amount);
  }

  return {
    ok: true,
    fetched: transactions.length,
    imported,
    unchanged,
    skipped,
    byMonth,
  };
}

/**
 * Upsert company ledger rows from seed (insert missing only).
 * Never recreates expenses the user deleted (see PnLExpenseExclusion).
 * Skips Ringba + BIGO.
 */
export async function importCompanyExpenseSeed(user) {
  requireMongo();
  const actor = actorFromUser(user);

  let imported = 0;
  let unchanged = 0;
  let skipped = 0;

  for (let index = 0; index < COMPANY_EXPENSE_SEED.length; index += 1) {
    const row = COMPANY_EXPENSE_SEED[index];
    const platform = String(row.platform || "").trim();
    if (/ringba/i.test(platform)) {
      skipped += 1;
      continue;
    }
    if (/^bigo$/i.test(platform)) {
      skipped += 1;
      continue;
    }

    const amount = round(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      skipped += 1;
      continue;
    }

    const date = String(row.date || "").trim();
    const month = date.slice(0, 7);
    monthBounds(month);
    const description = String(row.details || platform || "Expense").trim();
    const externalId = sheetExternalId(row, index);
    const category = categoryForPlatform(platform);

    const excluded = await PnLExpenseExclusion.findOne({ externalId }).lean();
    if (excluded) {
      skipped += 1;
      continue;
    }

    // Elijay / special contractor payouts stay on Historical only — not monthly P&L
    const historicalOnly = /elijay/i.test(platform) || /natalia\s*\(hpms\)/i.test(description);

    const existing = await PnLExpense.findOne({ source: "import", externalId });
    if (existing) {
      if (historicalOnly && !existing.historicalOnly) {
        existing.historicalOnly = true;
        existing.updatedBy = actor;
        await existing.save();
        imported += 1;
      } else {
        unchanged += 1;
      }
      continue;
    }

    await PnLExpense.create({
      month,
      date,
      category,
      platform,
      description,
      amount,
      paymentMethod: String(row.paymentMethod || "").trim(),
      receiptSaved: Boolean(row.receiptSaved),
      source: "import",
      externalId,
      historicalOnly,
      notes: "",
      createdBy: actor,
      updatedBy: actor,
    });
    imported += 1;
  }

  return {
    ok: true,
    imported,
    unchanged,
    skipped,
    totalSeedRows: COMPANY_EXPENSE_SEED.length,
  };
}


