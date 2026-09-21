import cors from "cors";
import express from "express";

import { config, hasAuthConfig, hasMongoConfig, hasQuickBooksConfig } from "./config.js";
import { connectMongo } from "./db/mongo.js";
import { migrateLegacySpendToMongo } from "./services/campaignSpendService.js";
import { importCompanyExpenseSeed } from "./services/pnlService.js";
import { requireAuth, requireAdmin, requireTodoOwner, forbidMediaBuyer } from "./middleware/authMiddleware.js";
import { startBigoControllerSyncJob } from "./jobs/bigoControllerSyncJob.js";
import { startCampaignSyncJob } from "./jobs/campaignSyncJob.js";
import { startInvoiceAlertJob } from "./jobs/invoiceAlertJob.js";
import { startOutreachPipelineJob } from "./jobs/outreachPipelineJob.js";
import { startReconciliationSyncJob } from "./jobs/reconciliationSyncJob.js";
import { startRingbaBillingSyncJob } from "./jobs/ringbaBillingSyncJob.js";
import { hasBigoAdsConfig } from "./services/bigoClient.js";
import authRoutes from "./routes/authRoutes.js";
import bigoRoutes from "./routes/bigoRoutes.js";
import buyerRoutes from "./routes/buyerRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import invoiceAlertRoutes from "./routes/invoiceAlertRoutes.js";
import outreachRoutes from "./routes/outreachRoutes.js";
import pnlRoutes from "./routes/pnlRoutes.js";
import reconciliationRoutes from "./routes/reconciliationRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
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
    quickBooksConfigured: hasQuickBooksConfig,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/campaign", requireAuth, campaignRoutes);
app.use("/api/reconciliation", requireAuth, forbidMediaBuyer, reconciliationRoutes);
app.use("/api/buyers", requireAuth, forbidMediaBuyer, buyerRoutes);
app.use("/api/outreach", requireAuth, forbidMediaBuyer, outreachRoutes);
app.use("/api/bigo", requireAuth, bigoRoutes);
app.use("/api/todos", requireAuth, requireTodoOwner, todoRoutes);
app.use("/api/accounting/pnl", requireAuth, forbidMediaBuyer, pnlRoutes);
app.use("/api/accounting/invoice-alerts", requireAuth, requireAdmin, invoiceAlertRoutes);
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
    await migrateLegacySpendToMongo();
    await ensureAdminUser();
    try {
      const seedResult = await importCompanyExpenseSeed({ name: "System", email: "system@nlm-portal" });
      console.log(
        `Company expense seed: imported ${seedResult.imported}, unchanged ${seedResult.unchanged}, skipped ${seedResult.skipped}`
      );
    } catch (error) {
      console.warn("Company expense seed skipped:", error.message);
    }
    startReconciliationSyncJob();
    startCampaignSyncJob();
    startRingbaBillingSyncJob();
    startInvoiceAlertJob();
    startOutreachPipelineJob();
    if (hasBigoAdsConfig()) {
      startBigoControllerSyncJob();
    }
    console.log("MongoDB enabled — portal reads from database (Ringba sync on schedule)");
  } else {
    console.log("MongoDB disabled — portal reads live from Ringba");
    startInvoiceAlertJob();
  }

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
