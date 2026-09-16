import mongoose from "mongoose";

const actorSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

/** Active workflow: pending → in_progress → testing → done (archives). `ongoing` kept for legacy docs. */
export const TODO_STATUSES = ["pending", "in_progress", "testing", "done", "ongoing"];

export const TODO_ACTIVE_STATUSES = ["pending", "in_progress", "testing"];

const todoItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    /** pending | in_progress | testing | done — marking done auto-archives */
    status: {
      type: String,
      enum: TODO_STATUSES,
      default: "pending",
      index: true,
    },
    archived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: actorSchema, default: () => ({}) },
    createdBy: { type: actorSchema, default: () => ({}) },
    updatedBy: { type: actorSchema, default: () => ({}) },
    lastEditedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

todoItemSchema.index({ archived: 1, status: 1, createdAt: -1 });

export const TodoItem = mongoose.model("TodoItem", todoItemSchema);
