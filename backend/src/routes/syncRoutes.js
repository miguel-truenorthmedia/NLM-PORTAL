import express from "express";

import { hasMongoConfig } from "../config.js";

import { syncAllPlatformData } from "../services/dataSyncService.js";



const router = express.Router();



router.post("/all", async (_req, res) => {

  if (!hasMongoConfig) {

    return res.status(400).json({

      error: "MongoDB is disabled. Set USE_MONGODB=true and MONGODB_URI in backend/.env",

    });

  }



  try {

    const result = await syncAllPlatformData({ daysBack: 60, reconciliationWeeks: 8 });

    return res.json(result);

  } catch (error) {

    console.error("Full platform sync failed:", error);

    return res.status(500).json({ error: error.message || "Failed to sync platform data" });

  }

});



export default router;

