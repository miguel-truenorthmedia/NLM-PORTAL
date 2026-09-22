import mongoose from "mongoose";

/** Short-lived CSRF state for Intuit OAuth connect flow */
const quickBooksOAuthStateSchema = new mongoose.Schema(
  {
    state: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    userEmail: { type: String, default: "" },
    userName: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

quickBooksOAuthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const QuickBooksOAuthState = mongoose.model(
  "QuickBooksOAuthState",
  quickBooksOAuthStateSchema
);
