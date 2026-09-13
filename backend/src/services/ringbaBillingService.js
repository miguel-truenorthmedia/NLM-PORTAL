import { ringbaGet } from "./ringbaClient.js";

/**
 * Ringba's CCTransactions endpoint is windowed oddly:
 * pastMonths=1 ≈ current/recent month, pastMonths=2 ≈ prior month, etc.
 * Cumulative ranges like pastMonths=6 often return empty, so we fetch each window.
 */
export async function fetchRingbaCcTransactions({ monthsBack = 5 } = {}) {
  const byRef = new Map();
  const windows = Math.max(1, Math.min(Number(monthsBack) || 5, 12));

  for (let pastMonths = 1; pastMonths <= windows; pastMonths += 1) {
    const data = await ringbaGet(`/Billing/CCTransactions?pastMonths=${pastMonths}`);
    const rows = Array.isArray(data?.ccTransactions) ? data.ccTransactions : [];
    for (const row of rows) {
      const key = String(row.refId || `${row.dtStamp}|${row.description}|${row.amount?.amount}`);
      if (!byRef.has(key)) byRef.set(key, row);
    }
  }

  return [...byRef.values()].sort((a, b) => String(b.dtStamp || "").localeCompare(String(a.dtStamp || "")));
}

export async function fetchRingbaAccountBalance() {
  const data = await ringbaGet("/Billing/Balance");
  return {
    accountBalance: Number(data?.accountBalance) || 0,
  };
}
