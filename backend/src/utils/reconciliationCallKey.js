/** Digits only — for phone search / matching. */
export function normalizePhone(value = "") {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Stable identity for a sold call within a campaign + buyer.
 * Used to exclude disputed rows across weekly Ringba re-syncs.
 */
export function buildCallKey({
  campaignName = "",
  buyerName = "",
  callDtRaw,
  inboundPhoneNumber = "",
  conversionAmount = 0,
} = {}) {
  return [
    String(campaignName).trim(),
    String(buyerName).trim(),
    String(callDtRaw ?? ""),
    normalizePhone(inboundPhoneNumber),
    String(Number(conversionAmount) || 0),
  ].join("|");
}

export function callMatchesKey(call, key, campaignName, buyerName) {
  return (
    buildCallKey({
      campaignName,
      buyerName,
      callDtRaw: call?.callDtRaw,
      inboundPhoneNumber: call?.inboundPhoneNumber,
      conversionAmount: call?.conversionAmount,
    }) === key
  );
}
