import { readFile } from "node:fs/promises";
import path from "node:path";

import { hasMongoConfig } from "../config.js";
import { CampaignSpendRow } from "../models/CampaignSpendRow.js";

const LEGACY_SPEND_PATH = path.resolve(process.cwd(), "data", "campaignDaily.json");

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

function round(value) {
  return Number(value.toFixed(2));
}

function spendRowKey(row) {
  return `${row.date}|${row.adAccountId}|${row.trafficSourceId}`;
}

async function loadLegacySpendRows() {
  try {
    const content = await readFile(LEGACY_SPEND_PATH, "utf8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeSpendRow);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    console.warn("Legacy campaign spend read failed:", error.message);
    return [];
  }
}

export async function migrateLegacySpendToMongo() {
  if (!hasMongoConfig) return { migrated: 0 };

  const legacyRows = await loadLegacySpendRows();
  if (!legacyRows.length) return { migrated: 0 };

  let migrated = 0;
  for (const row of legacyRows) {
    await CampaignSpendRow.findOneAndUpdate(
      {
        date: row.date,
        adAccountId: row.adAccountId,
        trafficSourceId: row.trafficSourceId,
      },
      {
        $set: {
          amount: row.amount,
          campaign: row.campaign,
          source: row.source,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    migrated += 1;
  }

  if (migrated > 0) {
    console.log(`Synced ${migrated} ad spend row(s) from campaignDaily.json into MongoDB`);
  }
  return { migrated };
}

export async function loadSpendRows() {
  if (hasMongoConfig) {
    const rows = await CampaignSpendRow.find().sort({ date: 1, adAccountId: 1 }).lean();
    return rows.map((row) =>
      normalizeSpendRow({
        date: row.date,
        adAccountId: row.adAccountId,
        trafficSourceId: row.trafficSourceId,
        amount: row.amount,
        campaign: row.campaign,
        source: row.source,
      })
    );
  }

  return loadLegacySpendRows();
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

async function resolveTrafficSourceId({ adAccount, trafficSourceId, getTrafficSourceById }) {
  const resolvedId = trafficSourceId || adAccount.trafficSourceId || "bigo";
  const trafficSource = await getTrafficSourceById(resolvedId);
  if (!trafficSource) {
    throw new Error("Traffic source not found");
  }
  return { trafficSourceId: resolvedId, trafficSource };
}

export async function upsertAdSpend({ date, adAccountId, amount, trafficSourceId, source = "manual" }) {
  const { getAdAccountById } = await import("./adAccountService.js");
  const { getTrafficSourceById } = await import("./trafficSourceService.js");

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
    getTrafficSourceById,
  });

  if (source === "manual" && trafficSource.spendMethod === "api") {
    throw new Error(`${trafficSource.label} spend is synced via API, not manual entry`);
  }

  const nextRow = {
    date,
    adAccountId,
    trafficSourceId: resolvedSourceId,
    amount: round(parsedAmount),
    campaign: account.displayName,
    source,
  };

  if (hasMongoConfig) {
    await CampaignSpendRow.findOneAndUpdate(
      {
        date: nextRow.date,
        adAccountId: nextRow.adAccountId,
        trafficSourceId: nextRow.trafficSourceId,
      },
      {
        $set: {
          amount: nextRow.amount,
          campaign: nextRow.campaign,
          source: nextRow.source,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    return nextRow;
  }

  const rows = await loadLegacySpendRows();
  const index = rows.findIndex((row) => spendRowKey(row) === spendRowKey(nextRow));
  if (index >= 0) {
    rows[index] = { ...rows[index], ...nextRow };
  } else {
    rows.push(nextRow);
  }

  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(path.dirname(LEGACY_SPEND_PATH), { recursive: true });
  await writeFile(LEGACY_SPEND_PATH, JSON.stringify(rows, null, 2), "utf8");
  return nextRow;
}

/** @deprecated Use upsertAdSpend */
export async function upsertBigoSpend({ date, adAccountId, bigoSpend }) {
  return upsertAdSpend({ date, adAccountId, amount: bigoSpend, trafficSourceId: "bigo" });
}
