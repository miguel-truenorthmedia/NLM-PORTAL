import cors from "cors";
import express from "express";

import { config, hasAuthConfig, hasMongoConfig } from "./config.js";
import { connectMongo } from "./db/mongo.js";
import { requireAuth, requireAdmin } from "./middleware/authMiddleware.js";
import { startCampaignSyncJob } from "./jobs/campaignSyncJob.js";
import { startReconciliationSyncJob } from "./jobs/reconciliationSyncJob.js";
import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import reconciliationRoutes from "./routes/reconciliationRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { User } from "./models/User.js";
import { createUser } from "./services/authService.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    dataSource: hasMongoConfig ? "mongodb" : "ringba",
    useMongoDb: config.useMongoDb,
    mongoConnected: hasMongoConfig,
    authEnabled: hasAuthConfig,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/campaign", requireAuth, campaignRoutes);
app.use("/api/reconciliation", requireAuth, reconciliationRoutes);
app.use("/api/sync", requireAuth, requireAdmin, syncRoutes);

async function ensureAdminUser() {
  if (!hasMongoConfig || !config.adminEmail || !config.adminPassword) return;

  const count = await User.countDocuments();
  if (count > 0) return;

  if (config.adminPassword.length < 8) {
    console.warn("ADMIN_PASSWORD must be at least 8 characters — admin user not seeded");
    return;
  }

  const user = await createUser({
    email: config.adminEmail,
    password: config.adminPassword,
    name: "Admin",
    role: "admin",
  });
  console.log(`Seeded admin user: ${user.email}`);
}

async function start() {
  if (!hasAuthConfig) {
    console.warn("JWT_SECRET is not set — auth routes will reject protected APIs");
  }

  if (hasMongoConfig) {
    await connectMongo();
    await ensureAdminUser();
    startReconciliationSyncJob();
    startCampaignSyncJob();
    console.log("MongoDB enabled — portal reads from database (Ringba sync on schedule)");
  } else {
    console.log("MongoDB disabled — portal reads live from Ringba");
  }

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
