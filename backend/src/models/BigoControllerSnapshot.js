import mongoose from "mongoose";

const bigoControllerSnapshotSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    accounts: { type: Array, default: [] },
    campaigns: { type: Array, default: [] },
    adsets: { type: Array, default: [] },
    fetchedAt: { type: Date, default: null },
    error: { type: String, default: "" },
    /** ET half-hour movement baseline metadata (arrows / future Slack). */
    movementBaselineAt: { type: Date, default: null },
    movementWindowStart: { type: Date, default: null },
  },
  { timestamps: true }
);

export const BigoControllerSnapshot = mongoose.model(
  "BigoControllerSnapshot",
  bigoControllerSnapshotSchema
);
