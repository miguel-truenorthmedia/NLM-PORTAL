import mongoose from "mongoose";

const campaignDailyRowSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  campaignId: { type: String, required: true, index: true },
  adAccountId: { type: String, required: true, index: true },
  offerType: String,
  campaign: String,
  adAccount: String,
  calls: Number,
  convertedCalls: Number,
  convertedPercent: Number,
  revenue: Number,
  syncedAt: { type: Date, default: Date.now },
});

campaignDailyRowSchema.index({ date: 1, campaignId: 1, adAccountId: 1 }, { unique: true });

export const CampaignDailyRow = mongoose.model("CampaignDailyRow", campaignDailyRowSchema);
