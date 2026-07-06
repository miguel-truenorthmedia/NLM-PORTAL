import "dotenv/config";
import { ringbaPost } from "../src/services/ringbaClient.js";

const filters = [
  {
    anyConditionToMatch: [
      { column: "buyer", value: "Elijay Marketing", isNegativeMatch: false, comparisonType: "EQUALS" },
    ],
  },
  {
    anyConditionToMatch: [
      { column: "campaignName", value: "NLM - Final Expense", isNegativeMatch: false, comparisonType: "EQUALS" },
    ],
  },
];

const window = {
  reportStart: "2026-06-29T04:00:00Z",
  reportEnd: "2026-07-04T03:59:59Z",
};

const summaryPayload = {
  ...window,
  groupByColumns: [{ column: "buyer", displayName: "Buyer" }],
  valueColumns: [
    { column: "callCount", aggregateFunction: null },
    { column: "convertedCalls", aggregateFunction: null },
    { column: "conversionAmount", aggregateFunction: null },
    { column: "payoutAmount", aggregateFunction: null },
    { column: "profitGross", aggregateFunction: null },
    { column: "earningsPerCallGross", aggregateFunction: null },
  ],
  orderByColumns: [{ column: "callCount", direction: "desc" }],
  formatTimespans: true,
  formatPercentages: true,
  generateRollups: true,
  maxResultsPerGroup: 1000,
  filters,
  formatTimeZone: "America/New_York",
};

const buyersPayload = {
  ...window,
  groupByColumns: [{ column: "buyer", displayName: "Buyer" }],
  valueColumns: [{ column: "callCount", aggregateFunction: null }],
  orderByColumns: [{ column: "callCount", direction: "desc" }],
  formatTimespans: true,
  formatPercentages: true,
  generateRollups: true,
  maxResultsPerGroup: 1000,
  filters: [
    {
      anyConditionToMatch: [
        { column: "campaignName", value: "NLM - Final Expense", isNegativeMatch: false, comparisonType: "EQUALS" },
      ],
    },
  ],
  formatTimeZone: "America/New_York",
};

const calllogsPayload = {
  ...window,
  orderByColumns: [{ column: "callDt", direction: "desc" }],
  filters,
  valueColumns: [
    { column: "campaignName" },
    { column: "publisherName" },
    { column: "buyer" },
    { column: "targetName" },
    { column: "callDt" },
    { column: "inboundPhoneNumber" },
    { column: "number" },
    { column: "callLengthInSeconds" },
    { column: "isDuplicate" },
    { column: "conversionAmount" },
    { column: "payoutAmount" },
    { column: "hasConverted" },
  ],
};

console.log("SUMMARY", JSON.stringify(await ringbaPost("/insights", summaryPayload), null, 2).slice(0, 2500));
console.log("\nBUYERS", JSON.stringify(await ringbaPost("/insights", buyersPayload), null, 2).slice(0, 1500));
const logs = await ringbaPost("/calllogs", calllogsPayload);
console.log("\nCALLLOGS KEYS", Object.keys(logs));
console.log("CALLLOGS SAMPLE", JSON.stringify(logs, null, 2).slice(0, 3000));
