import { ringbaGet } from "./ringbaClient.js";
import { hasRingbaConfig } from "../config.js";

const MOCK_CAMPAIGNS = [
  { id: "CAf073c253e2244171ac7c49a892f85299", name: "NLM - Final Expense", offerType: "FE", enabled: true },
  { id: "CAb348eb07739f4ef8ba1eb05509b8ff48", name: "NLM - ACA", offerType: "ACA", enabled: true },
  { id: "CA77168e7c224c4bcb90a8553ef1a1c9d9", name: "NLM - Medicare", offerType: "Medicare", enabled: false },
];

function inferOfferType(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("final expense") || lower.includes(" fe")) return "FE";
  if (lower.includes("aca")) return "ACA";
  if (lower.includes("medicare")) return "Medicare";
  return "Other";
}

function mapCampaign(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    offerType: inferOfferType(campaign.name),
    enabled: Boolean(campaign.enabled),
  };
}

export async function listCampaigns() {
  if (!hasRingbaConfig) return MOCK_CAMPAIGNS;

  try {
    const data = await ringbaGet("/campaigns/ui?includestats=true&includeDI=false&includeRTB=false");
    const campaigns = Array.isArray(data?.campaigns) ? data.campaigns : [];
    return campaigns.map(mapCampaign);
  } catch (error) {
    console.warn("Ringba campaigns fetch failed:", error.message);
    return MOCK_CAMPAIGNS;
  }
}

export async function getCampaignDetail(campaignId) {
  if (!hasRingbaConfig) {
    return { campaignId, mediaBuyers: [] };
  }

  try {
    const data = await ringbaGet(`/campaigns/${campaignId}?includeIntegrationSettings=true`);
    const numbers = data?.campaign?.affiliateNumbers || [];
    const mediaBuyers = numbers.map((item) => ({
      id: item.id,
      name: item.affiliate?.name || item.name,
      phoneNumber: item.phoneNumber,
      localNumber: item.localNumber,
      enabled: Boolean(item.enabled),
    }));
    return { campaignId, mediaBuyers };
  } catch (error) {
    console.warn("Ringba campaign detail fetch failed:", error.message);
    return { campaignId, mediaBuyers: [] };
  }
}
