import { connectMongo } from "../src/db/mongo.js";
import { syncLastWeekReconciliation } from "../src/services/reconciliationSyncService.js";

async function main() {
  await connectMongo();
  const result = await syncLastWeekReconciliation();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "failed" ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
