import { hasMongoConfig } from "../config.js";
import { Buyer, INVOICE_FREQUENCIES } from "../models/Buyer.js";

function normalizeBuyer(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email || "",
    net: Number.isFinite(doc.net) ? doc.net : 15,
    invoiceFrequency: INVOICE_FREQUENCIES.includes(doc.invoiceFrequency)
      ? doc.invoiceFrequency
      : "biweekly",
    notes: doc.notes || "",
    active: doc.active !== false,
    qboCustomerId: doc.qboCustomerId || "",
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

function requireMongo() {
  if (!hasMongoConfig) {
    throw new Error("MongoDB is required to manage buyers");
  }
}

function parseBuyerPayload(body = {}, { requireEmail = true } = {}) {
  const name = String(body.name || "").trim();
  if (!name) {
    throw new Error("Buyer name is required");
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (requireEmail && !email) {
    throw new Error("Email is required");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email is invalid");
  }

  const parsedNet = Number(body.net);
  if (!Number.isFinite(parsedNet) || parsedNet < 0) {
    throw new Error("Net pay must be a non-negative number of days");
  }

  const invoiceFrequency = String(body.invoiceFrequency || "biweekly").toLowerCase();
  if (!INVOICE_FREQUENCIES.includes(invoiceFrequency)) {
    throw new Error(`invoiceFrequency must be one of: ${INVOICE_FREQUENCIES.join(", ")}`);
  }

  return {
    name,
    email,
    net: Math.round(parsedNet),
    invoiceFrequency,
    notes: String(body.notes || "").trim(),
    active: body.active !== false,
    qboCustomerId:
      body.qboCustomerId !== undefined ? String(body.qboCustomerId || "").trim() : undefined,
  };
}

export async function listBuyers() {
  requireMongo();
  const rows = await Buyer.find().sort({ name: 1 }).lean();
  return { buyers: rows.map(normalizeBuyer) };
}

export async function createBuyer(body) {
  requireMongo();
  const payload = parseBuyerPayload(body, { requireEmail: true });

  const existing = await Buyer.findOne({ name: payload.name }).lean();
  if (existing) {
    throw new Error(`Buyer "${payload.name}" already exists`);
  }

  const created = await Buyer.create({
    name: payload.name,
    email: payload.email,
    net: payload.net,
    invoiceFrequency: payload.invoiceFrequency,
    notes: payload.notes,
    active: payload.active,
    qboCustomerId: payload.qboCustomerId || "",
  });

  return normalizeBuyer(created.toObject());
}

export async function updateBuyer(id, body) {
  requireMongo();

  if (!id) {
    throw new Error("Buyer id is required");
  }

  const payload = parseBuyerPayload(body, { requireEmail: true });
  const next = {
    name: payload.name,
    email: payload.email,
    net: payload.net,
    invoiceFrequency: payload.invoiceFrequency,
    notes: payload.notes,
    active: payload.active,
  };
  if (payload.qboCustomerId !== undefined) {
    next.qboCustomerId = payload.qboCustomerId;
  }

  const duplicate = await Buyer.findOne({
    name: payload.name,
    _id: { $ne: id },
  }).lean();
  if (duplicate) {
    throw new Error(`Buyer "${payload.name}" already exists`);
  }

  const saved = await Buyer.findByIdAndUpdate(id, { $set: next }, { new: true }).lean();
  if (!saved) {
    throw new Error("Buyer not found");
  }

  return normalizeBuyer(saved);
}

export async function deleteBuyer(id) {
  requireMongo();

  if (!id) {
    throw new Error("Buyer id is required");
  }

  const deleted = await Buyer.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new Error("Buyer not found");
  }

  return { deleted: true, id, name: deleted.name };
}

/** @deprecated Prefer createBuyer / updateBuyer */
export async function upsertBuyer(body) {
  requireMongo();
  const payload = parseBuyerPayload(body, { requireEmail: true });
  const saved = await Buyer.findOneAndUpdate(
    { name: payload.name },
    {
      $set: {
        email: payload.email,
        net: payload.net,
        invoiceFrequency: payload.invoiceFrequency,
        notes: payload.notes,
        active: payload.active,
        ...(payload.qboCustomerId !== undefined ? { qboCustomerId: payload.qboCustomerId } : {}),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return normalizeBuyer(saved);
}
