import express from "express";

import { hasMongoConfig } from "../config.js";
import { getLastWeekRange } from "../utils/dateRange.js";
import {
  getBuyersForCampaign as getBuyersFromRingba,
  getReconciliationData as getReconciliationFromRingba,
  getReconciliationFilters as getFiltersFromRingba,
} from "../services/reconciliationService.js";
import {
  getBuyersForCampaign as getBuyersFromMongo,
  getReconciliationData as getReconciliationFromMongo,
  getReconciliationFilters as getFiltersFromMongo,
  listSyncedWeeks,
} from "../services/reconciliationStoreService.js";
import {
  syncLastWeekReconciliation,
  syncReconciliationHistory,
  syncReconciliationWeek,
} from "../services/reconciliationSyncService.js";

const router = express.Router();

function withDataSource(payload) {
  return {
    ...payload,
    dataSource: hasMongoConfig ? "mongodb" : "ringba",
  };
}

router.get("/last-week", (_req, res) => {
  res.json(getLastWeekRange());
});

router.get("/weeks", async (_req, res) => {
  if (!hasMongoConfig) {
    return res.json({ weeks: [], dataSource: "ringba" });
  }

  try {
    const weeks = await listSyncedWeeks();
    return res.json(withDataSource({ weeks }));
  } catch (error) {
    console.error("Reconciliation weeks failed:", error);
    return res.status(500).json({ error: "Failed to fetch synced weeks" });
  }
});

router.get("/filters", async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const data = hasMongoConfig
      ? await getFiltersFromMongo(startDate, endDate)
      : await getFiltersFromRingba(startDate, endDate);
    return res.json(withDataSource(data));
  } catch (error) {
    console.error("Reconciliation filters failed:", error);
    return res.status(500).json({ error: "Failed to fetch reconciliation filters" });
  }
});

router.get("/buyers", async (req, res) => {
  const { campaignName, startDate, endDate } = req.query;
  if (!campaignName || !startDate || !endDate) {
    return res.status(400).json({ error: "campaignName, startDate, and endDate are required" });
  }
  try {
    const buyers = hasMongoConfig
      ? await getBuyersFromMongo(campaignName, startDate, endDate)
      : await getBuyersFromRingba(campaignName, startDate, endDate);
    return res.json(withDataSource({ buyers }));
  } catch (error) {
    console.error("Reconciliation buyers failed:", error);
    return res.status(500).json({ error: "Failed to fetch buyers" });
  }
});

router.get("/", async (req, res) => {
  const { campaignName, buyerName, startDate, endDate } = req.query;
  if (!campaignName || !startDate || !endDate) {
    return res.status(400).json({ error: "campaignName, startDate, and endDate are required" });
  }
  try {
    const payload = { campaignName, buyerName, startDate, endDate };
    const data = hasMongoConfig
      ? await getReconciliationFromMongo(payload)
      : await getReconciliationFromRingba(payload);
    return res.json(withDataSource(data));
  } catch (error) {
    console.error("Reconciliation fetch failed:", error);
    return res.status(500).json({ error: "Failed to fetch reconciliation data" });
  }
});

router.post("/sync", async (req, res) => {
  if (!hasMongoConfig) {
    return res
      .status(400)
      .json({ error: "MongoDB is disabled. Set USE_MONGODB=true and MONGODB_URI to enable sync." });
  }

  try {
    const weeksBack = Number(req.body?.weeksBack || req.query?.weeksBack || 0);
    const { startDate, endDate } = req.body || {};

    if (startDate && endDate) {
      const result = await syncReconciliationWeek({ startDate, endDate });
      return res.json(result);
    }

    if (weeksBack > 1) {
      const result = await syncReconciliationHistory(weeksBack);
      return res.json(result);
    }

    const result = await syncLastWeekReconciliation();
    return res.json(result);
  } catch (error) {
    console.error("Reconciliation sync failed:", error);
    return res.status(500).json({ error: error.message || "Failed to sync reconciliation data" });
  }
});

export default router;
