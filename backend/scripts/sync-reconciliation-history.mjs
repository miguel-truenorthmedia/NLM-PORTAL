import { connectMongo } from "../src/db/mongo.js";
import { syncReconciliationHistory } from "../src/services/reconciliationSyncService.js";

const weeksBack = Number(process.argv[2] || 8);

async function main() {
  await connectMongo();
  console.log(`Syncing last ${weeksBack} reconciliation weeks (upsert only, no deletes)...`);
  const result = await syncReconciliationHistory(weeksBack);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "failed" ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
