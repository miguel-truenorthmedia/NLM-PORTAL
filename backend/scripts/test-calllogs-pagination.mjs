import "dotenv/config";
import { ringbaPost } from "../src/services/ringbaClient.js";
import { buildReportWindow } from "../src/utils/dateRange.js";

const filters = [
  { anyConditionToMatch: [{ column: "buyer", value: "Elijay Marketing", isNegativeMatch: false, comparisonType: "EQUALS" }] },
  { anyConditionToMatch: [{ column: "campaignName", value: "NLM - Final Expense", isNegativeMatch: false, comparisonType: "EQUALS" }] },
];

const base = {
  ...buildReportWindow("2026-06-28", "2026-07-03"),
  orderByColumns: [{ column: "callDt", direction: "desc" }],
  filters,
  valueColumns: [
    { column: "callDt" },
    { column: "inboundPhoneNumber" },
    { column: "targetName" },
    { column: "conversionAmount" },
    { column: "hasConverted" },
  ],
};

async function fetchPage(offset, size) {
  const payload = { ...base, ...(size ? { offset, size } : {}) };
  const data = await ringbaPost("/calllogs", payload);
  return data?.report?.records || [];
}

console.log("WITHOUT pagination");
const noPage = await fetchPage(0, 0);
const soldNoPage = noPage.filter((r) => Number(String(r.conversionAmount || "0").replace(/[$,]/g, "")) > 0);
console.log("total", noPage.length, "sold", soldNoPage.length);

console.log("\nWITH pagination");
let offset = 0;
const size = 150;
let all = [];
while (true) {
  const page = await fetchPage(offset, size);
  all = all.concat(page);
  console.log(`offset ${offset}: ${page.length} records`);
  if (page.length < size) break;
  offset += size;
  if (offset > 10000) break;
}

const sold = all.filter((r) => Number(String(r.conversionAmount || "0").replace(/[$,]/g, "")) > 0);
console.log("total", all.length, "sold", sold.length);
