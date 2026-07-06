import mongoose from "mongoose";
import { config } from "../config.js";

export async function connectMongo() {
  if (!config.mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 30000,
    family: 4,
  });
  console.log("MongoDB connected");
}
