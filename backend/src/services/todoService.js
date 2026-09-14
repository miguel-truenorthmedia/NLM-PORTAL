import { hasMongoConfig } from "../config.js";
import { TodoItem, TODO_STATUSES } from "../models/TodoItem.js";

function requireMongo() {
  if (!hasMongoConfig) {
    throw new Error("MongoDB is required for todos");
  }
}

function actorFromUser(user) {
  if (!user) return { userId: "", name: "", email: "" };
  return {
    userId: String(user.id || user._id || ""),
    name: String(user.name || user.email || "Unknown").trim(),
    email: String(user.email || "").trim().toLowerCase(),
  };
}

function normalizeTodo(doc) {
  return {
    id: String(doc._id),
    title: doc.title || "",
    note: doc.note || "",
    status: doc.status || "ongoing",
    archived: Boolean(doc.archived),
    archivedAt: doc.archivedAt || null,
    archivedBy: doc.archivedBy || { userId: "", name: "", email: "" },
    createdBy: doc.createdBy || { userId: "", name: "", email: "" },
    updatedBy: doc.updatedBy || { userId: "", name: "", email: "" },
    lastEditedAt: doc.lastEditedAt || doc.updatedAt || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

export async function listTodos(_user, { archived = false } = {}) {
  requireMongo();
  const filter = archived ? { archived: true } : { archived: { $ne: true } };
  const docs = await TodoItem.find(filter).sort({ updatedAt: -1, createdAt: -1 }).lean();
  return {
    todos: docs.map(normalizeTodo),
    meta: { statuses: TODO_STATUSES, archived },
  };
}

export async function createTodo(payload, user) {
  requireMongo();
  const title = String(payload?.title || "").trim();
  if (!title) throw new Error("Title is required");

  const actor = actorFromUser(user);
  const note = String(payload?.note || "").trim();
  let status = String(payload?.status || "ongoing").trim().toLowerCase();
  if (!TODO_STATUSES.includes(status)) status = "ongoing";

  const archived = status === "done";
  const doc = await TodoItem.create({
    title,
    note,
    status,
    archived,
    archivedAt: archived ? new Date() : null,
    archivedBy: archived ? actor : {},
    createdBy: actor,
    updatedBy: actor,
    lastEditedAt: new Date(),
  });

  return normalizeTodo(doc);
}

export async function updateTodo(id, payload, user) {
  requireMongo();
  const doc = await TodoItem.findById(id);
  if (!doc) throw new Error("Todo not found");

  const actor = actorFromUser(user);
  const body = payload || {};

  if (body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) throw new Error("Title is required");
    doc.title = title;
  }

  if (body.note !== undefined) {
    doc.note = String(body.note || "").trim();
  }

  if (body.status !== undefined) {
    const status = String(body.status || "").trim().toLowerCase();
    if (!TODO_STATUSES.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${TODO_STATUSES.join(", ")}`);
    }
    doc.status = status;
    if (status === "done") {
      doc.archived = true;
      doc.archivedAt = new Date();
      doc.archivedBy = actor;
    } else if (status === "ongoing" && doc.archived) {
      doc.archived = false;
      doc.archivedAt = null;
      doc.archivedBy = {};
    }
  }

  if (body.archived !== undefined && body.status === undefined) {
    const next = Boolean(body.archived);
    doc.archived = next;
    if (next) {
      doc.status = "done";
      doc.archivedAt = new Date();
      doc.archivedBy = actor;
    } else {
      doc.status = "ongoing";
      doc.archivedAt = null;
      doc.archivedBy = {};
    }
  }

  doc.updatedBy = actor;
  doc.lastEditedAt = new Date();
  await doc.save();
  return normalizeTodo(doc);
}

export async function deleteTodo(id) {
  requireMongo();
  const doc = await TodoItem.findByIdAndDelete(id);
  if (!doc) throw new Error("Todo not found");
  return { ok: true, id: String(id) };
}
