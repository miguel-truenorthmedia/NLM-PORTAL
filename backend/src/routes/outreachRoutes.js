import { Router } from "express";
import {
  addOutreachNote,
  createOutreachProspect,
  deleteOutreachProspect,
  listOutreachProspects,
  setOutreachNoteIgnored,
  updateOutreachProspect,
} from "../services/outreachService.js";

const router = Router();

function statusForError(message = "") {
  if (message.includes("not found")) return 404;
  if (message.includes("Only CEO")) return 403;
  if (
    message.includes("required") ||
    message.includes("Invalid") ||
    message.includes("invalid") ||
    message.includes("before") ||
    message.includes("Allowed") ||
    message.includes("Log outreach")
  ) {
    return 400;
  }
  return 500;
}

router.get("/", async (req, res) => {
  try {
    const archived =
      req.query.archived === "1" ||
      req.query.archived === "true" ||
      req.query.view === "archive" ||
      req.query.view === "archived";
    const view = archived ? "archived" : String(req.query.view || "active").trim();
    const result = await listOutreachProspects(req.user, { archived, view });
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const prospect = await createOutreachProspect(req.body || {}, req.user);
    res.status(201).json({ prospect });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/:id/notes", async (req, res) => {
  try {
    const prospect = await addOutreachNote(req.params.id, req.body || {}, req.user);
    res.status(201).json({ prospect });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/:id/notes/:noteId/ignore", async (req, res) => {
  try {
    const ignored =
      req.body?.ignored === undefined ? true : Boolean(req.body.ignored);
    const prospect = await setOutreachNoteIgnored(
      req.params.id,
      req.params.noteId,
      ignored,
      req.user
    );
    res.json({ prospect });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

/** Alias — some clients/proxies mishandle PATCH */
router.patch("/:id/notes/:noteId", async (req, res) => {
  try {
    const prospect = await setOutreachNoteIgnored(
      req.params.id,
      req.params.noteId,
      Boolean(req.body?.ignored),
      req.user
    );
    res.json({ prospect });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const prospect = await updateOutreachProspect(req.params.id, req.body || {}, req.user);
    res.json({ prospect });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteOutreachProspect(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

export default router;
