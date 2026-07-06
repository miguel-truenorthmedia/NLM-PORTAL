import mongoose from "mongoose";

const cachedMetadataSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: mongoose.Schema.Types.Mixed,
  syncedAt: { type: Date, default: Date.now },
});

export const CachedMetadata = mongoose.model("CachedMetadata", cachedMetadataSchema);
