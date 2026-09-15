import mongoose from "mongoose";

const actorSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const bigoTrackedCampaignSchema = new mongoose.Schema(
  {
    advertiserId: { type: String, required: true, index: true },
    advertiserName: { type: String, default: "" },
    timezone: { type: Number, default: -5 },
    currency: { type: String, default: "USD" },
    campaignId: { type: String, required: true },
    campaignName: { type: String, default: "" },
    trackedBy: { type: actorSchema, default: () => ({}) },
  },
  { timestamps: true }
);

bigoTrackedCampaignSchema.index({ advertiserId: 1, campaignId: 1 }, { unique: true });

export const BigoTrackedCampaign = mongoose.model("BigoTrackedCampaign", bigoTrackedCampaignSchema);
