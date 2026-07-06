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
