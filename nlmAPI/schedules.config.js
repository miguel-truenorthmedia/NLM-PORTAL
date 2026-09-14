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
  {
    script: "ringbaBlockedNumberReset.js",
    schedule: "0 8 2,16 * *",
    timezone: "America/New_York",
    description:
      "On the 2nd and 16th at 8:00 AM ET: dedupe Ringba blocked list, then unblock all except permanent numbers",
  },
  {
    script: "nlmDropRate.js",
    schedule: "*/30 9-18 * * *",
    timezone: "America/New_York",
    description:
      "Campaign drop rate (-no value- / total) every 30 min, 9:00 AM–6:00 PM ET; Slack if total ≥ 20",
  },
];
