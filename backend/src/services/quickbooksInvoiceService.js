import { toEasternDateString, getTomorrowDate } from "../utils/dateRange.js";
import { quickBooksQueryAll } from "./quickbooksClient.js";

function mapInvoice(row) {
  return {
    id: row.Id,
    docNumber: row.DocNumber || row.Id,
    customerName: row.CustomerRef?.name || "Unknown customer",
    customerId: row.CustomerRef?.value || "",
    txnDate: row.TxnDate || "",
    dueDate: row.DueDate || "",
    totalAmt: Number(row.TotalAmt) || 0,
    balance: Number(row.Balance) || 0,
    currency: row.CurrencyRef?.value || "USD",
  };
}

/**
 * Unpaid invoices past due (DueDate < today ET, Balance > 0).
 */
export async function fetchOverdueInvoices(referenceDate = new Date()) {
  const today = toEasternDateString(referenceDate);
  const rows = await quickBooksQueryAll(
    `SELECT * FROM Invoice WHERE Balance > '0' AND DueDate < '${today}' ORDERBY DueDate ASC`
  );
  return rows.map(mapInvoice);
}

/**
 * Unpaid invoices due tomorrow (DueDate = tomorrow ET, Balance > 0).
 */
export async function fetchDueTomorrowInvoices(referenceDate = new Date()) {
  const tomorrow = getTomorrowDate(referenceDate);
  const rows = await quickBooksQueryAll(
    `SELECT * FROM Invoice WHERE Balance > '0' AND DueDate = '${tomorrow}' ORDERBY DocNumber ASC`
  );
  return rows.map(mapInvoice);
}

export async function fetchInvoiceAlertBuckets(referenceDate = new Date()) {
  const [overdue, dueTomorrow] = await Promise.all([
    fetchOverdueInvoices(referenceDate),
    fetchDueTomorrowInvoices(referenceDate),
  ]);

  return {
    asOfDate: toEasternDateString(referenceDate),
    tomorrowDate: getTomorrowDate(referenceDate),
    overdue,
    dueTomorrow,
  };
}
