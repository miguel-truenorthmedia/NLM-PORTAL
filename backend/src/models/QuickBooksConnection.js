import mongoose from "mongoose";

/**
 * Persisted QuickBooks Online OAuth connection (sandbox or production).
 * Tokens never leave the server.
 */
const quickBooksConnectionSchema = new mongoose.Schema(
  {
    /** sandbox | production — one connection doc per environment */
    environment: {
      type: String,
      enum: ["sandbox", "production"],
      required: true,
      unique: true,
    },
    realmId: { type: String, required: true, trim: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true },
    connectedAt: { type: Date, default: Date.now },
    connectedBy: {
      userId: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    lastRefreshedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const QuickBooksConnection = mongoose.model(
  "QuickBooksConnection",
  quickBooksConnectionSchema
);
