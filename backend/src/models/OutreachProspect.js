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
    /** Soft-ignore: strikethrough in UI; can be toggled freely */
    ignored: { type: Boolean, default: false },
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
    /**
     * Live pipeline tab (non-archived):
     * active | no_response | follow_up | accepted
     */
    pipelineBucket: {
      type: String,
      enum: ["active", "no_response", "follow_up", "accepted"],
      default: "active",
      index: true,
    },
    /** When status became "Awaiting response" — starts the 7-day No response clock */
    awaitingSince: { type: Date, default: null },
    /** When auto-moved into No response tab — starts the next 7-day Follow-up clock */
    noResponseSince: { type: Date, default: null },
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
outreachProspectSchema.index({ archived: 1, pipelineBucket: 1 });
outreachProspectSchema.index({ archived: 1, pipelineBucket: 1, followUpStatus: 1 });
outreachProspectSchema.index({ pipelineBucket: 1, awaitingSince: 1 });
outreachProspectSchema.index({ pipelineBucket: 1, noResponseSince: 1 });

export const OutreachProspect = mongoose.model("OutreachProspect", outreachProspectSchema);

/** How outreach was attempted */
export const REACH_OUT_STATUSES = ["Email", "Form Fill"];

/** Manual pipeline statuses (empty string = No status yet) */
export const FOLLOW_UP_STATUSES = [
  "Awaiting response",
  "In Communication",
  "Accepted",
  "Declined/not interested",
];

export const PIPELINE_BUCKETS = ["active", "no_response", "follow_up", "accepted"];

export const DEFAULT_FOLLOW_UP_STATUS = "Awaiting response";

/** Days before auto-moving Awaiting → No response, then No response → Follow-up */
export const PIPELINE_STALE_DAYS = 7;
