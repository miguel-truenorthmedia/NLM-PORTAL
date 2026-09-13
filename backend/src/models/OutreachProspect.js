import mongoose from "mongoose";

const actorSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const outreachProspectSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    emails: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one email is required",
      },
    },
    nlm: { type: String, default: "", trim: true },
    /** YYYY-MM-DD Eastern — set automatically on create */
    dateAdded: { type: String, required: true, index: true },
    /** Set automatically when reach-out status is first set */
    dateReachOut: { type: String, default: "" },
    reachOutStatus: { type: String, default: "", trim: true },
    /** Set automatically when follow-up status is first set */
    dateFollowUp: { type: String, default: "" },
    followUpStatus: { type: String, default: "", trim: true },
    createdBy: { type: actorSchema, default: () => ({}) },
    updatedBy: { type: actorSchema, default: () => ({}) },
    lastEditedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

outreachProspectSchema.index({ companyName: 1, dateAdded: -1 });

export const OutreachProspect = mongoose.model("OutreachProspect", outreachProspectSchema);

export const REACH_OUT_STATUSES = ["Emailed"];

export const FOLLOW_UP_STATUSES = ["No response", "Responded"];
