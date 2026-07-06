import { connectMongo } from "../src/db/mongo.js";
import { syncAllPlatformData } from "../src/services/dataSyncService.js";

async function main() {
  await connectMongo();
  console.log("Syncing campaign + reconciliation data from Ringba to MongoDB...");
  const result = await syncAllPlatformData({ daysBack: 60, reconciliationWeeks: 8 });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
