import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    callDt: String,
    callDtRaw: mongoose.Schema.Types.Mixed,
    campaignName: String,
    publisherName: String,
    buyer: String,
    targetName: String,
    inboundPhoneNumber: String,
    dialedNumber: String,
    callLength: String,
    callLengthInSeconds: Number,
    isDuplicate: Boolean,
    conversionAmount: Number,
    payoutAmount: Number,
    hasConverted: Boolean,
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    campaign: String,
    buyer: String,
    calls: Number,
    convertedCalls: Number,
    rpc: Number,
    revenue: Number,
    payout: Number,
    profit: Number,
    convertedPercent: Number,
  },
  { _id: false }
);

const reconciliationSnapshotSchema = new mongoose.Schema({
  startDate: { type: String, required: true, index: true },
  endDate: { type: String, required: true, index: true },
  campaignId: String,
  campaignName: { type: String, required: true, index: true },
  buyerName: { type: String, required: true, index: true },
  summary: summarySchema,
  calls: [callSchema],
  totalCallLogs: Number,
  soldCallCount: Number,
  syncedAt: { type: Date, default: Date.now },
});

reconciliationSnapshotSchema.index(
  { startDate: 1, endDate: 1, campaignName: 1, buyerName: 1 },
  { unique: true }
);

export const ReconciliationSnapshot = mongoose.model("ReconciliationSnapshot", reconciliationSnapshotSchema);
