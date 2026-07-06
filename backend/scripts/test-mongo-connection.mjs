import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set in backend/.env");
  process.exit(1);
}

const safeUri = uri.replace(/:([^:@/]+)@/, ":***@");
console.log("Connecting to:", safeUri);

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
    family: 4,
  });
  const ping = await mongoose.connection.db.admin().ping();
  console.log("MongoDB connection OK:", ping);
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error("MongoDB connection failed");
  console.error("Message:", error.message);
  if (error.code) console.error("Code:", error.code);
  if (error.codeName) console.error("Code name:", error.codeName);
  process.exit(1);
}
