import mongoose from "mongoose";
import crypto from "crypto";

export const INVITE_TYPES = ["invite", "password_reset"];
export const INVITE_STATUSES = ["pending", "used", "revoked"];
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

const actorSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const userInviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: INVITE_TYPES, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["admin", "ceo", "media_buyer"], default: "media_buyer" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: INVITE_STATUSES, default: "pending", index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
    createdBy: { type: actorSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userInviteSchema.statics.createTokenValue = function createTokenValue() {
  return crypto.randomBytes(32).toString("hex");
};

export const UserInvite = mongoose.model("UserInvite", userInviteSchema);
