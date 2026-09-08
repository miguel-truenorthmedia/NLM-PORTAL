import mongoose from "mongoose";

/**
 * Persists disputed/removed sold calls so weekly Ringba sync does not restore them.
 */
const reconciliationExcludedCallSchema = new mongoose.Schema(
  {
    campaignName: { type: String, required: true, index: true },
    buyerName: { type: String, required: true, index: true },
    callDtRaw: { type: mongoose.Schema.Types.Mixed, required: true },
    inboundPhoneNumber: { type: String, default: "" },
    conversionAmount: { type: Number, default: 0 },
    dialedNumber: { type: String, default: "" },
    callDt: { type: String, default: "" },
    targetName: { type: String, default: "" },
    reason: { type: String, default: "disputed" },
    removedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

reconciliationExcludedCallSchema.index(
  {
    campaignName: 1,
    buyerName: 1,
    callDtRaw: 1,
    inboundPhoneNumber: 1,
    conversionAmount: 1,
  },
  { unique: true }
);

export const ReconciliationExcludedCall = mongoose.model(
  "ReconciliationExcludedCall",
  reconciliationExcludedCallSchema
);
