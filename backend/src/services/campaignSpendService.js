import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAdAccountById } from "./adAccountService.js";
import { getTrafficSourceById } from "./trafficSourceService.js";

const DATA_DIR = path.resolve(process.cwd(), "data");
const SPEND_PATH = path.join(DATA_DIR, "campaignDaily.json");

function round(value) {
  return Number(value.toFixed(2));
}

function normalizeSpendRow(row) {
  const amount = Number(row.amount ?? row.bigoSpend ?? 0) || 0;
  return {
    date: row.date,
    adAccountId: row.adAccountId,
    trafficSourceId: row.trafficSourceId || "bigo",
    amount: round(amount),
    campaign: row.campaign || "",
    source: row.source || "manual",
  };
}

function spendRowKey(row) {
  return `${row.date}|${row.adAccountId}|${row.trafficSourceId}`;
}

export async function loadSpendRows() {
  try {
    const content = await readFile(SPEND_PATH, "utf8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeSpendRow);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    console.warn("Campaign spend read failed:", error.message);
    return [];
  }
}

async function writeSpendRows(rows) {
  await mkdir(DATA_DIR, { recursive: true });
  const payload = rows.map((row) => ({
    date: row.date,
    adAccountId: row.adAccountId,
    trafficSourceId: row.trafficSourceId,
    amount: row.amount,
    campaign: row.campaign,
    source: row.source || "manual",
  }));
  await writeFile(SPEND_PATH, JSON.stringify(payload, null, 2), "utf8");
}

export function getTotalSpendForDate(spendRows, date, adAccountId) {
  return spendRows
    .filter((row) => row.date === date && (!adAccountId || row.adAccountId === adAccountId))
    .reduce((sum, row) => sum + row.amount, 0);
}

export function getSpendBreakdownForDate(spendRows, date, adAccountId) {
  const breakdown = {};
  for (const row of spendRows) {
    if (row.date !== date) continue;
    if (adAccountId && row.adAccountId !== adAccountId) continue;
    breakdown[row.trafficSourceId] = round((breakdown[row.trafficSourceId] || 0) + row.amount);
  }
  return breakdown;
}

async function resolveTrafficSourceId({ adAccount, trafficSourceId }) {
  const resolvedId = trafficSourceId || adAccount.trafficSourceId || "bigo";
  const trafficSource = await getTrafficSourceById(resolvedId);
  if (!trafficSource) {
    throw new Error("Traffic source not found");
  }
  return { trafficSourceId: resolvedId, trafficSource };
}

export async function upsertAdSpend({ date, adAccountId, amount, trafficSourceId, source = "manual" }) {
  if (!date || !adAccountId) {
    throw new Error("date and adAccountId are required");
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    throw new Error("amount must be a non-negative number");
  }

  const account = await getAdAccountById(adAccountId);
  if (!account) {
    throw new Error("Ad account not found");
  }

  const { trafficSourceId: resolvedSourceId, trafficSource } = await resolveTrafficSourceId({
    adAccount: account,
    trafficSourceId,
  });

  if (source === "manual" && trafficSource.spendMethod === "api") {
    throw new Error(`${trafficSource.label} spend is synced via API, not manual entry`);
  }

  const rows = await loadSpendRows();
  const nextRow = {
    date,
    adAccountId,
    trafficSourceId: resolvedSourceId,
    amount: round(parsedAmount),
    campaign: account.displayName,
    source,
  };

  const index = rows.findIndex((row) => spendRowKey(row) === spendRowKey(nextRow));
  if (index >= 0) {
    rows[index] = { ...rows[index], ...nextRow };
  } else {
    rows.push(nextRow);
  }

  rows.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.adAccountId.localeCompare(b.adAccountId) ||
      a.trafficSourceId.localeCompare(b.trafficSourceId)
  );
  await writeSpendRows(rows);

  return nextRow;
}

/** @deprecated Use upsertAdSpend */
export async function upsertBigoSpend({ date, adAccountId, bigoSpend }) {
  return upsertAdSpend({ date, adAccountId, amount: bigoSpend, trafficSourceId: "bigo" });
}
