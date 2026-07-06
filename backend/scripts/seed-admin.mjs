import dotenv from "dotenv";
import mongoose from "mongoose";

import { config } from "../src/config.js";
import { User } from "../src/models/User.js";
import { createUser } from "../src/services/authService.js";

dotenv.config();

async function main() {
  if (!config.mongoUri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  if (!config.adminEmail || !config.adminPassword) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env");
    process.exit(1);
  }

  if (config.adminPassword.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 30000,
    family: 4,
  });

  const count = await User.countDocuments();
  if (count > 0) {
    console.log(`Users already exist (${count}). Skipping seed.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const user = await createUser({
    email: config.adminEmail,
    password: config.adminPassword,
    name: "Admin",
    role: "admin",
  });

  console.log("Admin user created:", user.email);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
