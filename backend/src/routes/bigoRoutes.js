import { Router } from "express";
import {
  getControllerLiveView,
  listBigoAccounts,
  listBigoCampaigns,
  listTrackedCampaigns,
  setAdsetPaused,
  setCampaignPaused,
  setTrackedCampaigns,
  syncControllerLive,
  updateAdsetBidBudget,
} from "../services/bigoCampaignService.js";

const router = Router();

function statusForError(message = "") {
  if (message.includes("not configured") || message.includes("Missing BIGO")) return 503;
  if (message.includes("required")) return 400;
  if (message.includes("not found")) return 404;
  return 500;
}

router.get("/accounts", async (_req, res) => {
  try {
    const result = await listBigoAccounts();
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.get("/campaigns", async (req, res) => {
  try {
    const result = await listBigoCampaigns(req.query.advertiserId);
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.get("/tracked", async (_req, res) => {
  try {
    const result = await listTrackedCampaigns();
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.put("/tracked", async (req, res) => {
  try {
    const result = await setTrackedCampaigns(req.body?.campaigns || [], req.user);
    // Respond immediately — full BIGO snapshot sync can exceed nginx's default 60s.
    res.json(result);
    syncControllerLive().catch((syncError) => {
      console.warn("BIGO snapshot refresh after track save failed:", syncError.message);
    });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.get("/controller-live", async (req, res) => {
  try {
    const forceRefresh =
      req.query.refresh === "1" ||
      req.query.refresh === "true" ||
      req.query.force === "1";
    const result = await getControllerLiveView({ forceRefresh });
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/adsets/:id/status", async (req, res) => {
  try {
    const result = await setAdsetPaused({
      advertiserId: req.body?.advertiserId,
      adsetId: req.params.id,
      paused: Boolean(req.body?.paused),
    });
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/adsets/:id/bid-budget", async (req, res) => {
  try {
    const result = await updateAdsetBidBudget({
      advertiserId: req.body?.advertiserId,
      adsetId: req.params.id,
      basicGoalBid: req.body?.basicGoalBid,
      budget: req.body?.budget,
      budgetMode: req.body?.budgetMode,
    });
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/campaigns/:id/status", async (req, res) => {
  try {
    const result = await setCampaignPaused({
      advertiserId: req.body?.advertiserId,
      campaignId: req.params.id,
      paused: Boolean(req.body?.paused),
    });
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

export default router;
