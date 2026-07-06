import "dotenv/config";
import axios from "axios";

const id = process.env.RINGBA_ACCOUNT_ID;
const token = process.env.RINGBA_API_TOKEN;
const headers = { Authorization: `Token ${token}`, "Content-Type": "application/json" };

const campaignId = "CAf073c253e2244171ac7c49a892f85299";

const detail = await axios.get(
  `https://api.ringba.com/v2/${id}/campaigns/${campaignId}?includeIntegrationSettings=true`,
  { headers }
);
console.log("DETAIL KEYS", Object.keys(detail.data));
console.log("DETAIL", JSON.stringify(detail.data).slice(0, 2500));

const accountPayload = {
  reportStart: "2026-06-29T04:00:00Z",
  reportEnd: "2026-06-30T03:59:59Z",
  groupByColumns: [{ column: "tag:User:account", displayName: "User:account" }],
  valueColumns: [
    { column: "callCount", aggregateFunction: null },
    { column: "convertedCalls", aggregateFunction: null },
    { column: "conversionAmount", aggregateFunction: null },
    { column: "convertedPercent", aggregateFunction: null },
    { column: "payoutAmount", aggregateFunction: null },
  ],
  orderByColumns: [{ column: "callCount", direction: "desc" }],
  formatTimespans: true,
  formatPercentages: true,
  generateRollups: true,
  maxResultsPerGroup: 1000,
  filters: [
    { column: "campaignId", value: campaignId, comparisonType: "EQUALS" },
    { column: "tag:User:account", value: "Franz--NLM-FE-1", comparisonType: "EQUALS" },
  ],
  formatTimeZone: "America/New_York",
};

const insights = await axios.post(`https://api.ringba.com/v2/${id}/insights`, accountPayload, { headers });
console.log("INSIGHTS ACCOUNT", JSON.stringify(insights.data, null, 2));
