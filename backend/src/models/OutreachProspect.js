import mongoose from "mongoose";

const actorSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdBy: { type: actorSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
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
    /** Prospect webpage form URL — shown as a "Form Fill" link in the sheet */
    formFillUrl: { type: String, default: "", trim: true },
    nlm: { type: String, default: "", trim: true },
    /** YYYY-MM-DD Eastern — set automatically on create */
    dateAdded: { type: String, required: true, index: true },
    /** Set automatically when reach-out method is first set */
    dateReachOut: { type: String, default: "" },
    /** "" | Email | Form Fill */
    reachOutStatus: { type: String, default: "", trim: true },
    /** Set automatically when follow-up status is first set */
    dateFollowUp: { type: String, default: "" },
    followUpStatus: { type: String, default: "", trim: true },
    notes: { type: [noteSchema], default: [] },
    archived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: actorSchema, default: () => ({}) },
    createdBy: { type: actorSchema, default: () => ({}) },
    updatedBy: { type: actorSchema, default: () => ({}) },
    lastEditedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

outreachProspectSchema.index({ companyName: 1, dateAdded: -1 });
outreachProspectSchema.index({ archived: 1, dateAdded: -1 });

export const OutreachProspect = mongoose.model("OutreachProspect", outreachProspectSchema);

/** How outreach was attempted */
export const REACH_OUT_STATUSES = ["Email", "Form Fill"];

/** Pipeline status after outreach has been logged */
export const FOLLOW_UP_STATUSES = [
  "Awaiting response",
  "Continuing attempt at outreach",
  "No response",
  "Currently in communication",
  "Accepted our business",
  "Declined our business",
];

export const DEFAULT_FOLLOW_UP_STATUS = "Awaiting response";
