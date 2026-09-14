import { Router } from "express";
import { createTodo, deleteTodo, listTodos, updateTodo } from "../services/todoService.js";

const router = Router();

function statusForError(message = "") {
  if (message.includes("not found")) return 404;
  if (message.includes("required") || message.includes("Invalid") || message.includes("Allowed")) {
    return 400;
  }
  return 500;
}

router.get("/", async (req, res) => {
  try {
    const archived =
      req.query.archived === "1" ||
      req.query.archived === "true" ||
      req.query.view === "archive";
    const result = await listTodos(req.user, { archived });
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const todo = await createTodo(req.body || {}, req.user);
    res.status(201).json({ todo });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const todo = await updateTodo(req.params.id, req.body || {}, req.user);
    res.json({ todo });
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteTodo(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(statusForError(error.message)).json({ error: error.message });
  }
});

export default router;
