import { syncCampaignData } from "./campaignSyncService.js";
import { syncReconciliationHistory } from "./reconciliationSyncService.js";

export { syncReconciliationHistory } from "./reconciliationSyncService.js";

export async function syncAllPlatformData({ daysBack = 60, reconciliationWeeks = 8 } = {}) {
  const campaign = await syncCampaignData({ daysBack });
  const reconciliation = await syncReconciliationHistory(reconciliationWeeks);

  return {
    campaign,
    reconciliationWeeks: reconciliation.weekCount,
    reconciliationSnapshots: reconciliation.snapshotsWritten,
    reconciliation,
  };
}
