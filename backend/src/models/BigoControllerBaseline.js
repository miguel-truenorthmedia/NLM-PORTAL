import mongoose from "mongoose";

/**
 * Half-hour baseline for Cost/CPC movement arrows + future Slack alerts.
 * Independent of the live 1-min controller snapshot (which stays current).
 * Only cost/cpc per entity — kept small on purpose.
 */
const bigoControllerBaselineSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    /** Start of the ET half-hour window this baseline belongs to (e.g. 10:00). */
    windowStart: { type: Date, default: null },
    /** When we captured the baseline metrics. */
    baselineAt: { type: Date, default: null },
    accounts: { type: Array, default: [] },
    campaigns: { type: Array, default: [] },
    adsets: { type: Array, default: [] },
  },
  { timestamps: true }
);

export const BigoControllerBaseline = mongoose.model(
  "BigoControllerBaseline",
  bigoControllerBaselineSchema
);
