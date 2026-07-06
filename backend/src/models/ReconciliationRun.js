import mongoose from "mongoose";

const reconciliationRunSchema = new mongoose.Schema({
  startDate: String,
  endDate: String,
  status: { type: String, enum: ["running", "success", "partial", "failed"] },
  startedAt: Date,
  completedAt: Date,
  campaignsProcessed: Number,
  snapshotsWritten: Number,
  syncErrors: [
    {
      campaignName: String,
      buyerName: String,
      message: String,
    },
  ],
  durationMs: Number,
});

export const ReconciliationRun = mongoose.model("ReconciliationRun", reconciliationRunSchema);
