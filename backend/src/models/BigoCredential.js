import mongoose from "mongoose";

const bigoCredentialSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    accessTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const BigoCredential = mongoose.model("BigoCredential", bigoCredentialSchema);
