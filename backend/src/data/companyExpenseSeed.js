/**
 * Company operating expenses (manual ledger).
 * Ringba rows are omitted — synced live from Ringba Billing API.
 * BIGO fund transfers are omitted — already counted as Campaign ad spend.
 */
export const COMPANY_EXPENSE_SEED = [
  { date: "2025-09-14", platform: "Northwest Agent", details: "NLM - Business Formation", amount: 143, paymentMethod: "Metrobank CC - Dianne", receiptSaved: true },
  { date: "2025-09-14", platform: "Northwest Agent", details: "NLM - Registered Agent", amount: 99, paymentMethod: "Metrobank CC - Dianne", receiptSaved: true },
  { date: "2025-10-22", platform: "Northwest Agent", details: "Nortrix - EIN", amount: 143, paymentMethod: "Metrobank CC - Dianne", receiptSaved: true },
  { date: "2025-10-22", platform: "Northwest Agent", details: "Nortrix - Business Formation", amount: 325, paymentMethod: "Metrobank CC - Dianne", receiptSaved: true },
  { date: "2026-04-01", platform: "Google", details: "Google Workspace", amount: 22.68, paymentMethod: "Security Bank CC - 0538", receiptSaved: true },
  { date: "2026-05-01", platform: "Google", details: "Google Workspace", amount: 22.68, paymentMethod: "Security Bank CC - 0538", receiptSaved: true },
  { date: "2026-06-01", platform: "Google", details: "Google Workspace", amount: 22.68, paymentMethod: "Security Bank CC - 0538", receiptSaved: true },
  { date: "2026-06-08", platform: "QuickBooks", details: "Bookkeeping || invoices", amount: 3.47, paymentMethod: "Security Bank CC - 0538", receiptSaved: true },
  { date: "2026-06-08", platform: "Northwest Agent", details: "NLM - Wyoming Renewal Filing: Annual Report - NLM", amount: 163, paymentMethod: "Metrobank CC - Dianne", receiptSaved: true },
  { date: "2026-07-01", platform: "NEXT", details: "Professional Liability", amount: 129.54, paymentMethod: "GCash", receiptSaved: true },
  { date: "2026-07-01", platform: "DigitalOcean", details: "DigitalOcean", amount: 14.91, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-01", platform: "NEXT", details: "Insurance", amount: 105.3, paymentMethod: "GCash", receiptSaved: true },
  { date: "2026-07-01", platform: "Google Workspace", details: "Google Workspace", amount: 32.48, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-01", platform: "Elijay", details: "Natalia (HPMS)", amount: 3250, paymentMethod: "JML Wise", receiptSaved: true },
  { date: "2026-07-02", platform: "Plesk", details: "Plesk", amount: 21.11, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-02", platform: "1Password", details: "1Password", amount: 5.53, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-02", platform: "NLM", details: "Gab salary", amount: 300, paymentMethod: "GCash", receiptSaved: true },
  { date: "2026-07-03", platform: "KAI AI", details: "Video Editing AI Token", amount: 50, paymentMethod: "Security Bank CC - 0538", receiptSaved: true },
  { date: "2026-07-03", platform: "KIE AI", details: "KIE AI", amount: 55.46, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-05", platform: "OpenAI", details: "OpenAI", amount: 19.66, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-07", platform: "QuickBooks", details: "QuickBooks", amount: 152.63, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-08", platform: "Corporate Filing", details: "Corporate Filing", amount: 181.13, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-08", platform: "Northwest Agent", details: "NLM - Wyoming Renewal Filing: Annual Report - Nortrix", amount: 163, paymentMethod: "Metrobank CC - Dianne", receiptSaved: true },
  { date: "2026-07-08", platform: "QuickBooks", details: "Bookkeeping || invoices", amount: 137.5, paymentMethod: "Security Bank CC - 0538", receiptSaved: true },
  { date: "2026-07-20", platform: "PDFIAD", details: "PDFIAD", amount: 43.46, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-20", platform: "Udemy", details: "Udemy", amount: 10.35, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-21", platform: "NLM", details: "NLM", amount: 5.57, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-07-23", platform: "Slack", details: "Slack", amount: 65.38, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-08-01", platform: "DigitalOcean", details: "DigitalOcean", amount: 14.91, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-08-01", platform: "Google", details: "Google Workspace", amount: 38.3, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-08-02", platform: "Plesk", details: "Web Admin Subscription", amount: 19.03, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-08-02", platform: "1Password", details: "1Password", amount: 5.53, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-08-05", platform: "OpenAI", details: "OpenAI Subscription", amount: 17.84, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-08-07", platform: "Performance Bonus", details: "Michael, owner's draws/LLC guaranteed payout", amount: 250, paymentMethod: "Chase Bank (Acct 1265)", receiptSaved: true },
  { date: "2026-08-18", platform: "NLM", details: "Gab salary", amount: 300, paymentMethod: "GCash", receiptSaved: true },
  { date: "2026-08-23", platform: "Slack", details: "Slack", amount: 65.38, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-08-31", platform: "NLM", details: "Gab salary", amount: 300, paymentMethod: "GCash", receiptSaved: true },
  { date: "2026-09-01", platform: "Google", details: "Google Workspace", amount: 46.35, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-09-01", platform: "DigitalOcean", details: "DigitalOcean", amount: 22.94, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-09-02", platform: "Plesk", details: "Web Admin Subscription", amount: 19.48, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-09-02", platform: "1Password", details: "1Password", amount: 5.53, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-09-05", platform: "OpenAI", details: "OpenAI Subscription", amount: 17.84, paymentMethod: "Security Bank Credit Card (PHP)", receiptSaved: true },
  { date: "2026-09-07", platform: "QuickBooks", details: "Bookkeeping || invoices", amount: 140.78, paymentMethod: "Security Bank CC - 0538", receiptSaved: true },
  { date: "2026-09-10", platform: "Elijay", details: "Natalia (HPMS)", amount: 3250, paymentMethod: "JML Wise", receiptSaved: true },
];

export function categoryForPlatform(platform = "") {
  const p = String(platform).toLowerCase();
  if (p.includes("ringba")) return "Ringba";
  if (p.includes("bigo") || p.includes("facebook") || p.includes("google ads")) return "Advertising tools";
  if (
    p.includes("northwest") ||
    p.includes("corporate filing") ||
    p.includes("registered agent")
  ) {
    return "Legal";
  }
  if (p.includes("next") || p.includes("insurance")) return "Insurance";
  if (p.includes("elijay") || p.includes("contractor")) return "Contractors";
  if (
    p.includes("salary") ||
    p.includes("performance bonus") ||
    p === "nlm" ||
    p.includes("payroll")
  ) {
    return "Payroll";
  }
  if (p.includes("digitalocean") || p.includes("plesk") || p.includes("host")) return "Hosting";
  if (
    p.includes("google") ||
    p.includes("quickbooks") ||
    p.includes("openai") ||
    p.includes("slack") ||
    p.includes("1password") ||
    p.includes("udemy") ||
    p.includes("pdfiad") ||
    p.includes("kai") ||
    p.includes("kie") ||
    p.includes("software")
  ) {
    return "Software";
  }
  return "Other";
}

export function sheetExternalId(row, index = 0) {
  return `sheet:${row.date}|${row.platform}|${row.details}|${Number(row.amount).toFixed(2)}|#${index}`;
}
