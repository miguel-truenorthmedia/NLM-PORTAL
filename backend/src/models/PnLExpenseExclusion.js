import mongoose from "mongoose";

/**
 * Remembers expense externalIds the user deleted so seed/sync won't recreate them.
 */
const pnLExpenseExclusionSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true, trim: true },
    source: { type: String, default: "" },
    description: { type: String, default: "" },
    deletedBy: {
      userId: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const PnLExpenseExclusion = mongoose.model("PnLExpenseExclusion", pnLExpenseExclusionSchema);
