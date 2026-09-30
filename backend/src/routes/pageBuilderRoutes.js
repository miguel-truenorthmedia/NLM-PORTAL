import { Router } from "express";

import { requireCeo } from "../middleware/authMiddleware.js";
import { listMbConfig, updateMbConfig } from "../services/adAccountService.js";

const router = Router();

router.get("/mb-config", async (_req, res) => {
  try {
    const accounts = await listMbConfig();
    res.json({ accounts });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Failed to load mb config" });
  }
});

router.put("/mb-config", requireCeo, async (req, res) => {
  try {
    const accounts = await updateMbConfig(req.body?.updates || req.body?.accounts || []);
    res.json({ accounts });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Failed to save mb config" });
  }
});

export default router;
