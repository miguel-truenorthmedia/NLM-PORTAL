export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Yesterday in server local calendar (used when 1 AM ET cron runs). */
export function getYesterdayDate(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

export function getLastWeekRange(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const daysToLastFriday = day === 0 ? 2 : day === 6 ? 1 : day + 2;
  const lastFriday = new Date(d);
  lastFriday.setDate(d.getDate() - daysToLastFriday);
  const lastMonday = new Date(lastFriday);
  lastMonday.setDate(lastFriday.getDate() - 4);
  const rangeStart = new Date(lastMonday);
  rangeStart.setDate(lastMonday.getDate() - 1);
  return {
    startDate: toLocalDateString(rangeStart),
    endDate: toLocalDateString(lastFriday),
  };
}

export function buildReportWindow(startDate, endDate) {
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const nextEnd = new Date(endYear, endMonth - 1, endDay + 1);
  return {
    reportStart: `${startDate}T04:00:00Z`,
    reportEnd: `${toLocalDateString(nextEnd)}T03:59:59Z`,
  };
}
