import mongoose from "mongoose";

const campaignSpendRowSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  adAccountId: { type: String, required: true, index: true },
  trafficSourceId: { type: String, required: true, default: "bigo" },
  amount: { type: Number, required: true },
  campaign: String,
  source: { type: String, default: "manual" },
  updatedAt: { type: Date, default: Date.now },
});

campaignSpendRowSchema.index({ date: 1, adAccountId: 1, trafficSourceId: 1 }, { unique: true });

export const CampaignSpendRow = mongoose.model("CampaignSpendRow", campaignSpendRowSchema);
