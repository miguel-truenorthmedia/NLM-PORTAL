import { shiftEasternDateString, toEasternDateString } from "../utils/dateRange.js";
import { config } from "../config.js";
import { quickBooksGet, quickBooksQuery, quickBooksQueryAll } from "./quickbooksClient.js";

/** Calendar-day difference (toIso - fromIso), no timezone shift. */
function calendarDaysBetween(fromIso, toIso) {
  const [y1, m1, d1] = String(fromIso).split("-").map(Number);
  const [y2, m2, d2] = String(toIso).split("-").map(Number);
  if (![y1, m1, d1, y2, m2, d2].every((n) => Number.isFinite(n))) return null;
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Derive portal status from balance + due date (Eastern calendar).
 * @returns {"PAID"|"OVERDUE"|"DUE_TODAY"|"OPEN"}
 */
export function deriveInvoiceStatus(invoice, referenceDate = new Date()) {
  const balance = Number(invoice.balance);
  if (!Number.isFinite(balance) || balance <= 0) return "PAID";

  const due = String(invoice.dueDate || "").trim();
  if (!due) return "OPEN";

  const today = toEasternDateString(referenceDate);
  if (due < today) return "OVERDUE";
  if (due === today) return "DUE_TODAY";
  return "OPEN";
}

function mapInvoice(row, referenceDate = new Date()) {
  const mapped = {
    id: String(row.Id || ""),
    docNumber: row.DocNumber || String(row.Id || ""),
    customerId: row.CustomerRef?.value || "",
    customerName: row.CustomerRef?.name || "Unknown customer",
    txnDate: row.TxnDate || "",
    dueDate: row.DueDate || "",
    totalAmount: Number(row.TotalAmt) || 0,
    balance: Number(row.Balance) || 0,
    currency: row.CurrencyRef?.value || "USD",
  };

  const today = toEasternDateString(referenceDate);
  mapped.status = deriveInvoiceStatus(mapped, referenceDate);
  mapped.daysOverdue =
    mapped.status === "OVERDUE" && mapped.dueDate
      ? calendarDaysBetween(mapped.dueDate, today)
      : null;
  mapped.daysUntilDue =
    mapped.status === "OPEN" && mapped.dueDate
      ? calendarDaysBetween(today, mapped.dueDate)
      : mapped.status === "DUE_TODAY"
        ? 0
        : null;

  return mapped;
}

/**
 * Unpaid invoices past due (DueDate < today ET, Balance > 0).
 */
export async function fetchOverdueInvoices(referenceDate = new Date()) {
  const today = toEasternDateString(referenceDate);
  const rows = await quickBooksQueryAll(
    `SELECT * FROM Invoice WHERE Balance > '0' AND DueDate < '${today}' ORDERBY DueDate ASC`
  );
  return rows.map((row) => mapInvoice(row, referenceDate));
}

/**
 * Unpaid invoices due tomorrow (DueDate = tomorrow ET, Balance > 0).
 */
export async function fetchDueTomorrowInvoices(referenceDate = new Date()) {
  const tomorrow = shiftEasternDateString(toEasternDateString(referenceDate), 1);
  const rows = await quickBooksQueryAll(
    `SELECT * FROM Invoice WHERE Balance > '0' AND DueDate = '${tomorrow}' ORDERBY DocNumber ASC`
  );
  return rows.map((row) => mapInvoice(row, referenceDate));
}

export async function fetchInvoiceAlertBuckets(referenceDate = new Date()) {
  const [overdue, dueTomorrow] = await Promise.all([
    fetchOverdueInvoices(referenceDate),
    fetchDueTomorrowInvoices(referenceDate),
  ]);
  return {
    overdue,
    dueTomorrow,
    asOfDate: toEasternDateString(referenceDate),
    tomorrowDate: shiftEasternDateString(toEasternDateString(referenceDate), 1),
  };
}

function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function buildArSummary(invoices, referenceDate = new Date()) {
  const today = toEasternDateString(referenceDate);
  const in7 = shiftEasternDateString(today, 7);
  const in30 = shiftEasternDateString(today, 30);

  let totalOutstanding = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let due7Amount = 0;
  let due7Count = 0;
  let due30Amount = 0;
  let due30Count = 0;

  for (const inv of invoices) {
    const balance = Number(inv.balance) || 0;
    if (balance <= 0) continue;

    totalOutstanding += balance;
    const due = String(inv.dueDate || "");

    if (due && due < today) {
      overdueAmount += balance;
      overdueCount += 1;
    }

    if (due && due >= today && due <= in7) {
      due7Amount += balance;
      due7Count += 1;
    }

    if (due && due >= today && due <= in30) {
      due30Amount += balance;
      due30Count += 1;
    }
  }

  return {
    asOfDate: today,
    totalOutstanding: roundMoney(totalOutstanding),
    overdue: { amount: roundMoney(overdueAmount), count: overdueCount },
    dueNext7Days: { amount: roundMoney(due7Amount), count: due7Count },
    dueNext30Days: { amount: roundMoney(due30Amount), count: due30Count },
  };
}

/**
 * Read-only: pull invoices from the connected QuickBooks company.
 * Default fetches a large page set so AR metrics are accurate in sandbox.
 */
export async function listNormalizedInvoices({
  referenceDate = new Date(),
  maxResults = 1000,
} = {}) {
  const size = Math.min(Math.max(Number(maxResults) || 1000, 1), 5000);
  const rows = await quickBooksQueryAll(
    `SELECT * FROM Invoice ORDERBY MetaData.LastUpdatedTime DESC`,
    { pageSize: Math.min(size, 1000) }
  );
  const sliced = rows.slice(0, size);
  const invoices = sliced.map((row) => mapInvoice(row, referenceDate));
  const summary = buildArSummary(invoices, referenceDate);

  return {
    environment: config.qboEnvironment === "production" ? "production" : "sandbox",
    count: invoices.length,
    asOfDate: toEasternDateString(referenceDate),
    summary,
    invoices,
  };
}

function mapBillingAddress(addr) {
  if (!addr || typeof addr !== "object") return null;
  const mapped = {
    line1: addr.Line1 || "",
    line2: addr.Line2 || "",
    city: addr.City || "",
    state: addr.CountrySubDivisionCode || "",
    postalCode: addr.PostalCode || "",
    country: addr.Country || "",
  };
  const hasAny = Object.values(mapped).some((v) => String(v).trim());
  return hasAny ? mapped : null;
}

function mapLineItems(lines) {
  if (!Array.isArray(lines)) return [];

  return lines
    .filter((line) => {
      const type = String(line?.DetailType || "");
      return type === "SalesItemLineDetail" || type === "DescriptionOnlyLineDetail";
    })
    .map((line) => {
      const sales = line.SalesItemLineDetail || {};
      const qtyRaw = sales.Qty;
      const priceRaw = sales.UnitPrice;
      const quantity =
        qtyRaw === undefined || qtyRaw === null || qtyRaw === ""
          ? null
          : Number(qtyRaw);
      const unitPrice =
        priceRaw === undefined || priceRaw === null || priceRaw === ""
          ? null
          : roundMoney(priceRaw);

      return {
        id: String(line.Id || ""),
        description: line.Description || sales.ItemRef?.name || "",
        quantity: Number.isFinite(quantity) ? quantity : null,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : null,
        amount: roundMoney(line.Amount),
        itemName: sales.ItemRef?.name || "",
      };
    });
}

async function enrichCustomerFromQbo(customerId, seed = {}) {
  const id = String(customerId || "").trim();
  if (!id) {
    return {
      id: "",
      name: seed.name || "Unknown customer",
      email: seed.email || "",
      billingAddress: seed.billingAddress || null,
    };
  }

  try {
    const data = await quickBooksGet(`customer/${encodeURIComponent(id)}`);
    const customer = data.Customer || {};
    const email =
      seed.email ||
      customer.PrimaryEmailAddr?.Address ||
      customer.BillEmail?.Address ||
      "";
    const billingAddress =
      seed.billingAddress ||
      mapBillingAddress(customer.BillAddr) ||
      mapBillingAddress(customer.ShipAddr);

    return {
      id,
      name: customer.DisplayName || customer.FullyQualifiedName || seed.name || "Unknown customer",
      email: email || "",
      billingAddress: billingAddress || null,
    };
  } catch (error) {
    // Invoice itself is enough — customer enrichment is best-effort
    console.warn(
      "[quickbooks] customer enrich failed",
      error.status || 500,
      String(error.message || "").slice(0, 200)
    );
    return {
      id,
      name: seed.name || "Unknown customer",
      email: seed.email || "",
      billingAddress: seed.billingAddress || null,
    };
  }
}

function buildQboInvoiceDeepLink(invoiceId, environment) {
  const id = String(invoiceId || "").trim();
  if (!id) return null;
  // Documented QBO app deep link pattern (sandbox vs production host).
  const host =
    environment === "production"
      ? "https://app.qbo.intuit.com"
      : "https://app.sandbox.qbo.intuit.com";
  return `${host}/app/invoice?txnId=${encodeURIComponent(id)}`;
}

/**
 * Read-only: fetch one invoice from QuickBooks by Id and normalize for the portal.
 */
export async function getNormalizedInvoiceDetail(
  invoiceId,
  { referenceDate = new Date() } = {}
) {
  const id = String(invoiceId || "").trim();
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    const err = new Error("Invalid invoice id");
    err.status = 400;
    throw err;
  }

  let data;
  try {
    data = await quickBooksGet(`invoice/${encodeURIComponent(id)}`);
  } catch (error) {
    const msg = String(error.message || "");
    if (
      error.status === 404 ||
      /object not found|not found/i.test(msg)
    ) {
      const err = new Error("Invoice not found in QuickBooks");
      err.status = 404;
      throw err;
    }
    throw error;
  }

  const row = data.Invoice;
  if (!row?.Id) {
    const err = new Error("Invoice not found in QuickBooks");
    err.status = 404;
    throw err;
  }

  const base = mapInvoice(row, referenceDate);
  const totalAmount = roundMoney(base.totalAmount);
  const balance = roundMoney(base.balance);
  const amountPaid = roundMoney(Math.max(0, totalAmount - balance));

  const invoiceEmail = row.BillEmail?.Address || "";
  const invoiceAddress = mapBillingAddress(row.BillAddr);
  const customer = await enrichCustomerFromQbo(base.customerId, {
    name: base.customerName,
    email: invoiceEmail,
    billingAddress: invoiceAddress,
  });

  const environment = config.qboEnvironment === "production" ? "production" : "sandbox";
  const deliveryEmail =
    row.DeliveryInfo?.DeliveryAddress?.Email ||
    row.BillEmail?.Address ||
    customer.email ||
    "";
  const emailStatus = row.EmailStatus || row.DeliveryInfo?.DeliveryStatus || "";

  const invoice = {
    id: base.id,
    docNumber: base.docNumber,
    customer,
    txnDate: base.txnDate,
    dueDate: base.dueDate,
    status: base.status,
    daysOverdue: base.daysOverdue,
    daysUntilDue: base.daysUntilDue,
    totalAmount,
    balance,
    amountPaid,
    currency: base.currency || "USD",
    lineItems: mapLineItems(row.Line),
    customerMemo: row.CustomerMemo?.value || "",
    privateNote: row.PrivateNote || "",
    emailStatus: emailStatus || "",
    deliveryInfo: {
      emailAddress: deliveryEmail || "",
      emailStatus: emailStatus || "",
    },
    qboDeepLink: buildQboInvoiceDeepLink(base.id, environment),
  };

  return {
    environment,
    asOfDate: toEasternDateString(referenceDate),
    invoice,
  };
}

/** Keep export for one-off query helpers */
export { quickBooksQuery };
