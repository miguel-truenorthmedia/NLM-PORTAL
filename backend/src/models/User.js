import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["admin", "media_buyer"], default: "media_buyer" },
    adAccountIds: { type: [String], default: [] },
    buyerNames: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
