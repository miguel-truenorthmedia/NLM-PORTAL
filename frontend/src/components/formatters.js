export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatPercent(value) {
  return `${(value || 0).toFixed(2)}%`;
}

/** ISO date (YYYY-MM-DD) → M/D */
export function formatDateShort(date) {
  if (!date) return "";
  const [year, month, day] = String(date).split("-");
  if (!month || !day) return date;
  return `${Number(month)}/${Number(day)}`;
}

/** ISO calendar date (YYYY-MM-DD) → Sep 15, 2026 (no UTC shift) */
export function formatDateMedium(date) {
  if (!date) return "";
  const [year, month, day] = String(date).split("-").map(Number);
  if (!year || !month || !day) return String(date);
  const local = new Date(year, month - 1, day);
  return local.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** ISO date range → M/D – M/D */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "";
  return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
}
