import { Router } from "express";
import { createBuyer, deleteBuyer, listBuyers, updateBuyer } from "../services/buyerService.js";

const router = Router();

function statusForError(message = "") {
  if (message.includes("not found")) return 404;
  if (
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("invalid") ||
    message.includes("already exists")
  ) {
    return 400;
  }
  return 500;
}

router.get("/", async (_req, res) => {
  try {
    const result = await listBuyers();
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const buyer = await createBuyer(req.body || {});
    res.status(201).json({ buyer });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const buyer = await updateBuyer(req.params.id, req.body || {});
    res.json({ buyer });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteBuyer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

export default router;
