/**
 * Spend provider registry.
 * Manual sources are entered in the UI. API sources will be synced by a future job.
 */

export async function fetchFacebookAdsSpend() {
  return [];
}

export async function fetchGoogleAdsSpend() {
  return [];
}

const API_PROVIDERS = {
  "facebook-ads": fetchFacebookAdsSpend,
  "google-ads": fetchGoogleAdsSpend,
};

export async function fetchSpendFromApi({ trafficSource, adAccount, startDate, endDate }) {
  const provider = API_PROVIDERS[trafficSource.apiProvider];
  if (!provider) {
    throw new Error(`No API provider configured for ${trafficSource.id}`);
  }

  return provider({ adAccount, startDate, endDate, trafficSource });
}

export function isApiTrafficSource(trafficSource) {
  return trafficSource?.spendMethod === "api";
}

export function isManualTrafficSource(trafficSource) {
  return trafficSource?.spendMethod === "manual";
}
