import cors from "cors";
import express from "express";
import { config, hasMongoConfig } from "./config.js";
import { connectMongo } from "./db/mongo.js";
import { startCampaignSyncJob } from "./jobs/campaignSyncJob.js";
import { startReconciliationSyncJob } from "./jobs/reconciliationSyncJob.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import reconciliationRoutes from "./routes/reconciliationRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    dataSource: hasMongoConfig ? "mongodb" : "ringba",
    useMongoDb: config.useMongoDb,
    mongoConnected: hasMongoConfig,
  });
});

app.use("/api/campaign", campaignRoutes);
app.use("/api/reconciliation", reconciliationRoutes);
app.use("/api/sync", syncRoutes);

async function start() {
  if (hasMongoConfig) {
    await connectMongo();
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
