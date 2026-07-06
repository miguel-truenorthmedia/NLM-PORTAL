import {
  getSpendDateFromEmailReceivedAt,
  parseBigoSpendEmail,
} from "../src/services/bigoEmailParser.js";

const sampleHtml = `
<table>
  <tr>
    <th>Account Name</th><th>Account ID</th><th>Campaign</th><th>Country</th><th>Time Capped</th><th>Spend($)</th>
  </tr>
  <tr>
    <td>Franz--NLM-FE-1</td><td>325558</td><td>Franz - FE - 1</td><td>us</td><td></td><td>237.94</td>
  </tr>
</table>
`;

const rows = parseBigoSpendEmail({ html: sampleHtml });
const spendDate = getSpendDateFromEmailReceivedAt(new Date("2026-07-04T10:53:00-04:00"));

console.log("Parsed rows:", rows);
console.log("Spend date for email received July 4:", spendDate);

if (rows[0]?.spend !== 237.94) throw new Error("Spend parse failed");
if (spendDate !== "2026-07-03") throw new Error(`Expected 2026-07-03, got ${spendDate}`);

console.log("OK");
