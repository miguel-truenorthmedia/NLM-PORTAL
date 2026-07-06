import express from "express";
import { getDailyKpis } from "../services/kpiService.js";
import { addManualSpendRow } from "../services/googleSheetsService.js";

const router = express.Router();

router.get("/daily", async (req, res) => {
  const { startDate, endDate, campaign = "", publisher = "" } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  try {
    const data = await getDailyKpis(startDate, endDate, { campaign, publisher });
    return res.json(data);
  } catch (error) {
    console.error("KPI fetch failed:", error);
    return res.status(500).json({ error: "Failed to fetch KPI data" });
  }
});

router.post("/spend", async (req, res) => {
  const { date, campaign, publisher, adGroup, spend } = req.body || {};
  if (!date || !adGroup || spend === undefined || spend === null) {
    return res.status(400).json({ error: "date, adGroup, and spend are required" });
  }

  const parsedSpend = Number(spend);
  if (!Number.isFinite(parsedSpend) || parsedSpend < 0) {
    return res.status(400).json({ error: "spend must be a valid non-negative number" });
  }

  try {
    const saved = await addManualSpendRow({ date, campaign, publisher, adGroup, spend: parsedSpend });
    return res.status(201).json({ saved });
  } catch (error) {
    console.error("Manual spend save failed:", error);
    return res.status(500).json({ error: "Failed to save manual spend" });
  }
});

export default router;
