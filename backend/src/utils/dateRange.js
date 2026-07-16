export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const EASTERN_TIME_ZONE = "America/New_York";

/** Calendar date string (YYYY-MM-DD) in Eastern time. */
export function toEasternDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Yesterday in Eastern time — used by the 1 AM ET daily Ringba sync. */
export function getYesterdayDate(referenceDate = new Date()) {
  const easternToday = toEasternDateString(referenceDate);
  const [year, month, day] = easternToday.split("-").map(Number);
  const easternDate = new Date(year, month - 1, day);
  easternDate.setDate(easternDate.getDate() - 1);
  return toLocalDateString(easternDate);
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

/** Business week N weeks before the most recent completed week (0 = last week). */
export function getWeekRangeWeeksAgo(weeksAgo = 0, referenceDate = new Date()) {
  const offset = Math.max(0, Number(weeksAgo) || 0);
  const reference = new Date(referenceDate);
  reference.setHours(0, 0, 0, 0);
  reference.setDate(reference.getDate() - offset * 7);
  return getLastWeekRange(reference);
}

export function buildReportWindow(startDate, endDate) {
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const nextEnd = new Date(endYear, endMonth - 1, endDay + 1);
  return {
    reportStart: `${startDate}T04:00:00Z`,
    reportEnd: `${toLocalDateString(nextEnd)}T03:59:59Z`,
  };
}
