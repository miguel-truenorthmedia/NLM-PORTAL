export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(isoDate) {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(isoDate) {
  const date = parseLocalDate(isoDate);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getYesterdayDate(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

/** Monday-start week containing referenceDate. */
export function getThisWeekRange(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
  };
}

export function getThisMonthRange(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
  };
}

export function getLastMonthRange(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const end = new Date(d.getFullYear(), d.getMonth(), 0);
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
  };
}

/** First day of the month 5 months ago → last day of current month (6 calendar months). */
export function getLast6MonthsRange(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d.getFullYear(), d.getMonth() - 5, 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
  };
}

export function getThisYearRange(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31);
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
  };
}

export function getDateRangePreset(key, referenceDate = new Date()) {
  switch (key) {
    case "thisWeek":
      return getThisWeekRange(referenceDate);
    case "thisMonth":
      return getThisMonthRange(referenceDate);
    case "lastMonth":
      return getLastMonthRange(referenceDate);
    case "last6Months":
      return getLast6MonthsRange(referenceDate);
    case "thisYear":
      return getThisYearRange(referenceDate);
    default:
      return null;
  }
}

export function getLast7DaysRange(referenceDate = new Date()) {
  const end = new Date(referenceDate);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
  };
}

export function getDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return 0;
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

export function aggregateRowsByDate(rows = []) {
  const map = new Map();

  for (const row of rows) {
    const existing = map.get(row.date) || {
      date: row.date,
      adSpend: 0,
      revenue: 0,
      profit: 0,
      calls: 0,
      convertedCalls: 0,
    };

    existing.adSpend += row.adSpend || 0;
    existing.revenue += row.revenue || 0;
    existing.profit += row.profit || 0;
    existing.calls += row.calls || 0;
    existing.convertedCalls += row.convertedCalls || 0;
    map.set(row.date, existing);
  }

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}
