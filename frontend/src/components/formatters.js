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

/** ISO date range → M/D – M/D */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "";
  return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
}
