import { readFile } from "node:fs/promises";
import path from "node:path";

const AD_ACCOUNTS_PATH = path.resolve(process.cwd(), "data", "adAccounts.json");

export async function listAdAccounts() {
  const content = await readFile(AD_ACCOUNTS_PATH, "utf8");
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
}

export async function getAdAccountsFiltered({ offerType = "", campaignId = "" } = {}) {
  const accounts = await listAdAccounts();
  return accounts.filter((account) => {
    if (offerType && account.offerType !== offerType) return false;
    if (campaignId && account.campaignId !== campaignId) return false;
    return true;
  });
}

export async function getAdAccountById(id) {
  const accounts = await listAdAccounts();
  return accounts.find((account) => account.id === id) || null;
}
