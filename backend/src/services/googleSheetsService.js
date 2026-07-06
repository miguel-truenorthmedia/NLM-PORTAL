import { google } from "googleapis";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config, hasGoogleSheetsConfig } from "../config.js";

const SHEET_TAB = "Daily Spend";
const MOCK_SPEND = [
  { date: "2026-05-07", adGroup: "AG006", spend: 224.2 },
  { date: "2026-05-07", adGroup: "AG007", spend: 166.72 },
  { date: "2026-05-08", adGroup: "AG006", spend: 211.15 },
  { date: "2026-05-08", adGroup: "Unknown", spend: 22.6 },
];
const DATA_DIR = path.resolve(process.cwd(), "data");
const MANUAL_SPEND_PATH = path.join(DATA_DIR, "manualSpend.json");

function inRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

function parseSpendRows(rows = []) {
  return rows
    .map((row) => {
      const date = String(row[0] || "").trim();
      const adGroup = String(row[1] || "").trim() || "Unknown";
      const spend = Number(row[2] || 0) || 0;
      const campaign = String(row[3] || "").trim() || "Unknown";
      const publisher = String(row[4] || "").trim() || "Unknown";
      return { date, campaign, publisher, adGroup, spend };
    })
    .filter((row) => row.date);
}

async function readManualSpendRows() {
  try {
    const content = await readFile(MANUAL_SPEND_PATH, "utf8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        date: String(row?.date || "").trim(),
        campaign: String(row?.campaign || "").trim() || "Unknown",
        publisher: String(row?.publisher || "").trim() || "Unknown",
        adGroup: String(row?.adGroup || "").trim() || "Unknown",
        spend: Number(row?.spend || 0) || 0,
      }))
      .filter((row) => row.date);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    console.warn("Manual spend read failed:", error.message);
    return [];
  }
}

async function writeManualSpendRows(rows) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(MANUAL_SPEND_PATH, JSON.stringify(rows, null, 2), "utf8");
}

async function fetchSheetSpendRows() {
  const auth = new google.auth.JWT({
    email: config.googleServiceAccountEmail,
    key: config.googlePrivateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const range = `${SHEET_TAB}!A2:C`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.googleSheetsId,
    range,
  });

  return parseSpendRows(response.data.values || []);
}

export async function getSpendRows(startDate, endDate) {
  const manualRows = await readManualSpendRows();
  const filteredManualRows = manualRows.filter((row) => inRange(row.date, startDate, endDate));

  if (!hasGoogleSheetsConfig) {
    const mockRows = MOCK_SPEND.filter((row) => inRange(row.date, startDate, endDate));
    return [...mockRows, ...filteredManualRows];
  }

  try {
    const rows = await fetchSheetSpendRows();
    const filteredSheetRows = rows.filter((row) => inRange(row.date, startDate, endDate));
    return [...filteredSheetRows, ...filteredManualRows];
  } catch (error) {
    console.warn("Google Sheets fetch failed, using mock spend data:", error.message);
    const mockRows = MOCK_SPEND.filter((row) => inRange(row.date, startDate, endDate));
    return [...mockRows, ...filteredManualRows];
  }
}

export async function addManualSpendRow({ date, campaign, publisher, adGroup, spend }) {
  const rows = await readManualSpendRows();
  const normalized = {
    date: String(date || "").trim(),
    campaign: String(campaign || "").trim() || "Unknown",
    publisher: String(publisher || "").trim() || "Unknown",
    adGroup: String(adGroup || "").trim() || "Unknown",
    spend: Number(spend || 0) || 0,
  };
  rows.push(normalized);
  await writeManualSpendRows(rows);
  return normalized;
}
