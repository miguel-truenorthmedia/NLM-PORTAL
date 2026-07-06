import { syncBigoSpendFromEmail } from "../src/services/bigoEmailSpendService.js";

async function main() {
  const result = await syncBigoSpendFromEmail();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.errors.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
