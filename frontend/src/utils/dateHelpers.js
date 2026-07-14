export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDate(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
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
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
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
