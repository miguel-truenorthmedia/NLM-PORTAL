import api from "./authApi.js";

export { default } from "./authApi.js";
export async function fetchFilterOptions() {
  const response = await api.get("/campaign/filters");
  return response.data;
}

export async function fetchCampaignDaily(startDate, endDate, filters = {}) {
  const response = await api.get("/campaign/daily", {
    params: {
      startDate,
      endDate,
      offerType: filters.offerType || "",
      campaignId: filters.campaignId || "",
      adAccountId: filters.adAccountId || "",
    },
  });
  return response.data;
}

export async function saveAdSpend({ date, adAccountId, amount, trafficSourceId }) {
  const response = await api.post("/campaign/spend", { date, adAccountId, amount, trafficSourceId });
  return response.data;
}

/** @deprecated Use saveAdSpend */
export async function saveBigoSpend(payload) {
  return saveAdSpend({
    date: payload.date,
    adAccountId: payload.adAccountId,
    amount: payload.bigoSpend,
    trafficSourceId: payload.trafficSourceId,
  });
}

export async function fetchRingbaCampaigns() {
  const response = await api.get("/campaign/ringba/campaigns");
  return response.data;
}

export async function fetchAdAccounts() {
  const response = await api.get("/campaign/ad-accounts");
  return response.data;
}

export async function fetchReconciliationFilters(startDate, endDate) {
  const response = await api.get("/reconciliation/filters", {
    params: { startDate: startDate || "", endDate: endDate || "" },
  });
  return response.data;
}

export async function fetchSyncedWeeks() {
  const response = await api.get("/reconciliation/weeks");
  return response.data;
}

export async function syncReconciliationHistory(weeksBack = 8) {
  const response = await api.post("/reconciliation/sync", { weeksBack });
  return response.data;
}

export async function fetchReconciliationBuyers(campaignName, startDate, endDate) {
  const response = await api.get("/reconciliation/buyers", {
    params: { campaignName, startDate, endDate },
  });
  return response.data;
}

export async function fetchReconciliation({ campaignName, buyerName, startDate, endDate }) {
  const response = await api.get("/reconciliation", {
    params: { campaignName, buyerName: buyerName || "", startDate, endDate },
  });
  return response.data;
}

export async function deleteReconciliationCall({
  campaignName,
  buyerName,
  callDtRaw,
  inboundPhoneNumber,
  conversionAmount,
}) {
  const response = await api.delete("/reconciliation/calls", {
    data: {
      campaignName,
      buyerName,
      callDtRaw,
      inboundPhoneNumber,
      conversionAmount,
    },
  });
  return response.data;
}

export async function fetchBuyers() {
  const response = await api.get("/buyers");
  return response.data;
}

export async function createBuyer(payload) {
  const response = await api.post("/buyers", payload);
  return response.data;
}

export async function updateBuyer(id, payload) {
  const response = await api.put(`/buyers/${id}`, payload);
  return response.data;
}

export async function deleteBuyer(id) {
  const response = await api.delete(`/buyers/${id}`);
  return response.data;
}

export async function fetchOutreachProspects({ archived = false } = {}) {
  const response = await api.get("/outreach", {
    params: archived ? { archived: true } : undefined,
  });
  return response.data;
}

export async function createOutreachProspect(payload) {
  const response = await api.post("/outreach", payload);
  return response.data;
}

export async function updateOutreachProspect(id, payload) {
  const response = await api.put(`/outreach/${id}`, payload);
  return response.data;
}

export async function addOutreachNote(id, payload) {
  const response = await api.post(`/outreach/${id}/notes`, payload);
  return response.data;
}

export async function deleteOutreachProspect(id) {
  const response = await api.delete(`/outreach/${id}`);
  return response.data;
}

export async function fetchTodos({ archived = false } = {}) {
  const response = await api.get("/todos", {
    params: archived ? { archived: true } : undefined,
  });
  return response.data;
}

export async function createTodo(payload) {
  const response = await api.post("/todos", payload);
  return response.data;
}

export async function updateTodo(id, payload) {
  const response = await api.put(`/todos/${id}`, payload);
  return response.data;
}

export async function deleteTodo(id) {
  const response = await api.delete(`/todos/${id}`);
  return response.data;
}

export async function fetchBigoAccounts() {
  const response = await api.get("/bigo/accounts");
  return response.data;
}

export async function fetchBigoCampaigns(advertiserId) {
  const response = await api.get("/bigo/campaigns", {
    params: { advertiserId },
  });
  return response.data;
}

export async function fetchBigoTracked() {
  const response = await api.get("/bigo/tracked");
  return response.data;
}

export async function saveBigoTracked(campaigns) {
  const response = await api.put("/bigo/tracked", { campaigns });
  return response.data;
}

export async function fetchBigoControllerLive({ refresh = false } = {}) {
  const response = await api.get("/bigo/controller-live", {
    params: refresh ? { refresh: 1 } : undefined,
  });
  return response.data;
}

export async function setBigoAdsetPaused({ advertiserId, adsetId, paused }) {
  const response = await api.post(`/bigo/adsets/${adsetId}/status`, {
    advertiserId,
    paused,
  });
  return response.data;
}

export async function updateBigoAdsetBidBudget({
  advertiserId,
  adsetId,
  basicGoalBid,
  budget,
  budgetMode,
}) {
  const response = await api.post(`/bigo/adsets/${adsetId}/bid-budget`, {
    advertiserId,
    basicGoalBid,
    budget,
    budgetMode,
  });
  return response.data;
}

export async function setBigoCampaignPaused({ advertiserId, campaignId, paused }) {
  const response = await api.post(`/bigo/campaigns/${campaignId}/status`, {
    advertiserId,
    paused,
  });
  return response.data;
}

export async function fetchPnLOverview(month) {
  const response = await api.get("/accounting/pnl", {
    params: { month: month || "" },
  });
  return response.data;
}

export async function fetchPnLHistorical() {
  const response = await api.get("/accounting/pnl/historical");
  return response.data;
}

export async function syncRingbaPnLBilling(monthsBack = 5) {
  const response = await api.post("/accounting/pnl/sync-ringba", { monthsBack });
  return response.data;
}

export async function importCompanyPnLExpenses() {
  const response = await api.post("/accounting/pnl/import-company");
  return response.data;
}

export async function createPnLExpense(payload) {
  const response = await api.post("/accounting/pnl/expenses", payload);
  return response.data;
}

export async function updatePnLExpense(id, payload) {
  const response = await api.put(`/accounting/pnl/expenses/${id}`, payload);
  return response.data;
}

export async function hidePnLExpense(id) {
  const response = await api.delete(`/accounting/pnl/expenses/${id}`);
  return response.data;
}

export async function deletePnLExpense(id) {
  const response = await api.delete(`/accounting/pnl/expenses/${id}`, {
    params: { hard: true },
  });
  return response.data;
}

/** @deprecated Use createBuyer / updateBuyer */
export async function saveBuyer(payload) {
  if (payload?.id) {
    return updateBuyer(payload.id, payload);
  }
  return createBuyer(payload);
}
