import { connectMongo } from "../src/db/mongo.js";
import { syncYesterdayCampaignData } from "../src/services/campaignSyncService.js";

async function main() {
  await connectMongo();
  console.log("Syncing yesterday's campaign data from Ringba...");
  const result = await syncYesterdayCampaignData();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "failed" ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
