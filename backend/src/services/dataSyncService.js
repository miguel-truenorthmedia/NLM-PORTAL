import { syncCampaignData } from "./campaignSyncService.js";
import { syncReconciliationWeek } from "./reconciliationSyncService.js";
import { getLastWeekRange } from "../utils/dateRange.js";

export async function syncReconciliationHistory(weekCount = 8) {
  const results = [];
  for (let i = 0; i < weekCount; i += 1) {
    const reference = new Date();
    reference.setDate(reference.getDate() - i * 7);
    const { startDate, endDate } = getLastWeekRange(reference);
    results.push(await syncReconciliationWeek({ startDate, endDate }));
  }
  return results;
}

export async function syncAllPlatformData({ daysBack = 60, reconciliationWeeks = 8 } = {}) {
  const campaign = await syncCampaignData({ daysBack });
  const reconciliation = await syncReconciliationHistory(reconciliationWeeks);

  return {
    campaign,
    reconciliationWeeks: reconciliation.length,
    reconciliationSnapshots: reconciliation.reduce((sum, r) => sum + r.snapshotsWritten, 0),
    reconciliation,
  };
}
