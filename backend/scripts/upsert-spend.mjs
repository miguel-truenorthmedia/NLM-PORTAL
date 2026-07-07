import { connectMongo } from "../src/db/mongo.js";
import { migrateLegacySpendToMongo } from "../src/services/campaignSpendService.js";
import { upsertAdSpend } from "../src/services/campaignSpendService.js";

const args = process.argv.slice(2);
const date = args[0] || "2026-07-06";
const adAccountId = args[1] || "franz-fe-1";
const amount = args[2] || "379.58";

async function main() {
  await connectMongo();
  await migrateLegacySpendToMongo();

  const row = await upsertAdSpend({
    date,
    adAccountId,
    amount: Number(amount),
    trafficSourceId: "bigo",
  });

  console.log("Saved ad spend to MongoDB:", row);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
