import { runInvoiceDueAlerts } from "../src/services/invoiceAlertService.js";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const notifyWhenClear = process.argv.includes("--notify-when-clear");

  console.log(
    `Running QBO invoice due alerts${dryRun ? " (dry-run)" : ""}${
      notifyWhenClear ? " (notify when clear)" : ""
    }...`
  );

  const result = await runInvoiceDueAlerts({ dryRun, notifyWhenClear });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
