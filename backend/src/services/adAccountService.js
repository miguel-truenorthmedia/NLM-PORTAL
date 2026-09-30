import { readFile, writeFile } from "node:fs/promises";
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

function sanitizeMb(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

/** CEO URL-builder config: list portal ad accounts with their mb values. */
export async function listMbConfig() {
  const accounts = await listAdAccounts();
  return accounts.map((account) => ({
    id: account.id,
    displayName: account.displayName || account.id,
    bigoAccountId: account.bigoAccountId || "",
    trafficSourceId: account.trafficSourceId || "bigo",
    mb: sanitizeMb(account.mb || account.publisherName || ""),
  }));
}

/**
 * Update mb values by portal ad account id.
 * @param {Array<{ id: string, mb: string }>} updates
 */
export async function updateMbConfig(updates = []) {
  if (!Array.isArray(updates) || updates.length === 0) {
    const error = new Error("updates array is required");
    error.status = 400;
    throw error;
  }

  const accounts = await listAdAccounts();
  const byId = new Map(
    updates
      .map((row) => [String(row?.id || "").trim(), sanitizeMb(row?.mb)])
      .filter(([id]) => id)
  );

  if (!byId.size) {
    const error = new Error("No valid account updates provided");
    error.status = 400;
    throw error;
  }

  let changed = 0;
  const next = accounts.map((account) => {
    if (!byId.has(account.id)) return account;
    const mb = byId.get(account.id);
    if (sanitizeMb(account.mb) === mb) return account;
    changed += 1;
    return { ...account, mb };
  });

  const missing = [...byId.keys()].filter((id) => !accounts.some((a) => a.id === id));
  if (missing.length) {
    const error = new Error(`Unknown ad account id(s): ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }

  if (changed > 0) {
    await writeFile(AD_ACCOUNTS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  }

  return listMbConfig();
}
