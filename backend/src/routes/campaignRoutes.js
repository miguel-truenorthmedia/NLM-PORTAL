import express from "express";

import { hasMongoConfig } from "../config.js";

import { getCampaignDaily } from "../services/campaignService.js";

import {

  getCampaignDailyFromStore,

  getFilterOptionsFromStore,

} from "../services/campaignStoreService.js";

import { getFilterOptions } from "../services/campaignService.js";

import { upsertAdSpend } from "../services/campaignSpendService.js";

import { syncCampaignData, syncYesterdayCampaignData } from "../services/campaignSyncService.js";

import { listCampaigns, getCampaignDetail } from "../services/ringbaCampaignService.js";

import { listAdAccounts } from "../services/adAccountService.js";

import { listTrafficSources } from "../services/trafficSourceService.js";



const router = express.Router();



function withDataSource(payload) {

  return {

    ...payload,

    dataSource: hasMongoConfig ? "mongodb" : "ringba",

  };

}



router.get("/filters", async (_req, res) => {

  try {

    const data = hasMongoConfig ? await getFilterOptionsFromStore() : await getFilterOptions();

    return res.json(withDataSource(data));

  } catch (error) {

    console.error("Filter options fetch failed:", error);

    return res.status(500).json({ error: "Failed to fetch filter options" });

  }

});



router.get("/traffic-sources", async (_req, res) => {

  try {

    const trafficSources = await listTrafficSources();

    return res.json({ trafficSources });

  } catch (error) {

    console.error("Traffic sources fetch failed:", error);

    return res.status(500).json({ error: "Failed to fetch traffic sources" });

  }

});



router.post("/spend", async (req, res) => {

  const { date, adAccountId, amount, bigoSpend, trafficSourceId } = req.body || {};

  const spendAmount = amount ?? bigoSpend;



  if (!date || !adAccountId || spendAmount === undefined || spendAmount === "") {

    return res.status(400).json({ error: "date, adAccountId, and amount are required" });

  }



  try {

    const row = await upsertAdSpend({

      date,

      adAccountId,

      amount: spendAmount,

      trafficSourceId,

    });

    if (hasMongoConfig) {
      syncYesterdayCampaignData().catch((error) => {
        console.warn(`Ringba refresh after spend save failed for ${date}:`, error.message);
      });
    }

    return res.json({ ok: true, row });

  } catch (error) {

    console.error("Campaign spend save failed:", error);

    return res.status(400).json({ error: error.message || "Failed to save ad spend" });

  }

});



router.get("/daily", async (req, res) => {

  const { startDate, endDate, offerType = "", campaignId = "", adAccountId = "" } = req.query;

  if (!startDate || !endDate) {

    return res.status(400).json({ error: "startDate and endDate are required" });

  }



  try {

    const filters = { offerType, campaignId, adAccountId };

    const data = hasMongoConfig

      ? await getCampaignDailyFromStore(startDate, endDate, filters)

      : await getCampaignDaily(startDate, endDate, filters);

    return res.json(withDataSource(data));

  } catch (error) {

    console.error("Campaign daily fetch failed:", error);

    return res.status(500).json({ error: "Failed to fetch campaign data" });

  }

});



router.post("/sync", async (_req, res) => {
  if (!hasMongoConfig) {
    return res.status(400).json({ error: "MongoDB is disabled. Set USE_MONGODB=true and MONGODB_URI." });
  }

  try {
    const result = await syncCampaignData({ daysBack: 60 });
    return res.json(result);
  } catch (error) {
    console.error("Campaign sync failed:", error);
    return res.status(500).json({ error: error.message || "Failed to sync campaign data" });
  }
});

router.post("/sync/yesterday", async (_req, res) => {
  if (!hasMongoConfig) {
    return res.status(400).json({ error: "MongoDB is disabled. Set USE_MONGODB=true and MONGODB_URI." });
  }

  try {
    const result = await syncYesterdayCampaignData();
    return res.json(result);
  } catch (error) {
    console.error("Yesterday campaign sync failed:", error);
    return res.status(500).json({ error: error.message || "Failed to sync yesterday's campaign data" });
  }
});



router.get("/ringba/campaigns", async (_req, res) => {

  try {

    const campaigns = await listCampaigns();

    return res.json({ campaigns });

  } catch (error) {

    return res.status(500).json({ error: "Failed to fetch Ringba campaigns" });

  }

});



router.get("/ringba/campaigns/:campaignId", async (req, res) => {

  try {

    const detail = await getCampaignDetail(req.params.campaignId);

    return res.json(detail);

  } catch (error) {

    return res.status(500).json({ error: "Failed to fetch campaign detail" });

  }

});



router.get("/ad-accounts", async (_req, res) => {

  try {

    const adAccounts = await listAdAccounts();

    return res.json({ adAccounts });

  } catch (error) {

    return res.status(500).json({ error: "Failed to fetch ad accounts" });

  }

});



export default router;

