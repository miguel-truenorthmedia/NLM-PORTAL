/**
 * Schedules for nlmAPI automation scripts.
 * Cron format: "minute hour day-of-month month day-of-week"
 */
export default [
  {
    script: "ringbaNumberBlocker.js",
    schedule: "*/3 * * * *",
    timezone: "America/New_York",
    description:
      "Block inbound numbers with 3+ calls in the current ET day — every 3 min, 24/7 Eastern",
  },
];
