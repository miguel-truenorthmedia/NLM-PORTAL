import { Router } from "express";
import {
  createPnLExpense,
  deletePnLExpense,
  getPnLHistorical,
  getPnLOverview,
  importCompanyExpenseSeed,
  listPnLExpenses,
  syncRingbaBillingExpenses,
  updatePnLExpense,
} from "../services/pnlService.js";

const router = Router();

function statusForError(message = "") {
  if (message.includes("not found")) return 404;
  if (
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("Invalid") ||
    message.includes("Allowed") ||
    message.includes("YYYY-MM")
  ) {
    return 400;
  }
  return 500;
}

router.get("/", async (req, res) => {
  try {
    const result = await getPnLOverview({ month: req.query.month });
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.get("/historical", async (_req, res) => {
  try {
    const result = await getPnLHistorical();
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.get("/expenses", async (req, res) => {
  try {
    const result = await listPnLExpenses({ month: req.query.month });
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/sync-ringba", async (req, res) => {
  try {
    const monthsBack = Number(req.body?.monthsBack || req.query.monthsBack || 5);
    const result = await syncRingbaBillingExpenses({ monthsBack }, req.user);
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/import-company", async (req, res) => {
  try {
    const result = await importCompanyExpenseSeed(req.user);
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/expenses", async (req, res) => {
  try {
    const expense = await createPnLExpense(req.body || {}, req.user);
    res.status(201).json({ expense });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.put("/expenses/:id", async (req, res) => {
  try {
    const expense = await updatePnLExpense(req.params.id, req.body || {}, req.user);
    res.json({ expense });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  try {
    const result = await deletePnLExpense(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

export default router;
