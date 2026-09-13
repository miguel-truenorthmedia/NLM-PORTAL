import { hasMongoConfig } from "../config.js";
import {
  FOLLOW_UP_STATUSES,
  OutreachProspect,
  REACH_OUT_STATUSES,
} from "../models/OutreachProspect.js";
import { toEasternDateString } from "../utils/dateRange.js";

function requireMongo() {
  if (!hasMongoConfig) {
    throw new Error("MongoDB is required for the outreach sheet");
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

function normalizeEmails(input) {
  const raw = Array.isArray(input)
    ? input.join(" ")
    : String(input || "");
  const parts = raw
    .split(/[\s,;|]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(parts)];
  for (const email of unique) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Invalid email: ${email}`);
    }
  }
  return unique;
}

function normalizeProspect(doc) {
  return {
    id: String(doc._id),
    companyName: doc.companyName || "",
    emails: Array.isArray(doc.emails) ? doc.emails : [],
    nlm: doc.nlm || "",
    dateAdded: doc.dateAdded || "",
    dateReachOut: doc.dateReachOut || "",
    reachOutStatus: doc.reachOutStatus || "",
    dateFollowUp: doc.dateFollowUp || "",
    followUpStatus: doc.followUpStatus || "",
    createdBy: doc.createdBy || { userId: "", name: "", email: "" },
    updatedBy: doc.updatedBy || { userId: "", name: "", email: "" },
    lastEditedAt: doc.lastEditedAt || doc.updatedAt || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

const SEED_ROWS = [
  { companyName: "Rya Digital", emails: ["micaela@rya.digital"], dateAdded: "2026-09-13" },
  { companyName: "7Made", emails: ["admin@7made.net"] },
  { companyName: "North Star", emails: ["tonyhakim@northstaria.com"] },
  { companyName: "Integrant", emails: ["info@integriant.com"] },
  { companyName: "Policy Guiders", emails: ["support@policyguiders.com"] },
  { companyName: "Hello Support Network", emails: ["tayyab@hellosupportnetwork.com"] },
  { companyName: "Hello Support Network", emails: ["kashifbaloch@hellosupportnetwork.com"] },
  { companyName: "Insure Connect", emails: ["info@insureconnectmedicare.co"] },
  { companyName: "Thrive Insurance Partners", emails: ["info@thriveinsurancepartners.com"] },
  { companyName: "Prime Senior Benefits", emails: ["counsumermarketingpsb@yahoo.com"] },
  { companyName: "Policy Printer", emails: ["support@policyprinter.io"] },
  { companyName: "Ocean Beach Media", emails: ["admin@oceanbeachmedia.com"] },
  {
    companyName: "Partners Edge",
    emails: ["chazz@partnersedge.com", "liza@partnersedge.com", "ash@partnersedge.com"],
  },
  { companyName: "B&B Insurance Leads", emails: ["admin@bbinsuranceleads.io"] },
  { companyName: "We Buy Calls", emails: ["team@webuycalls.com"] },
  {
    companyName: "Webster Solution",
    emails: ["markwebster@webstersolution.co", "saad@webstersolution.co"],
  },
  { companyName: "Admy Telecom", emails: ["michlak@admytelecom.com"] },
  { companyName: "LeadZod", emails: ["sjbrief@leadzod.com"] },
  { companyName: "Prestige Calls", emails: ["business@prestigecalls.com"] },
];

async function ensureSeeded(actor) {
  const count = await OutreachProspect.countDocuments();
  if (count > 0) return;

  const today = toEasternDateString();
  const docs = SEED_ROWS.map((row) => ({
    companyName: row.companyName,
    emails: row.emails,
    nlm: "",
    dateAdded: row.dateAdded || today,
    dateReachOut: "",
    reachOutStatus: "",
    dateFollowUp: "",
    followUpStatus: "",
    createdBy: actor,
    updatedBy: actor,
    lastEditedAt: new Date(),
  }));
  await OutreachProspect.insertMany(docs);
}

export async function listOutreachProspects(user) {
  requireMongo();
  await ensureSeeded(actorFromUser(user));
  const rows = await OutreachProspect.find().sort({ dateAdded: -1, companyName: 1 }).lean();
  return {
    prospects: rows.map(normalizeProspect),
    meta: {
      reachOutStatuses: REACH_OUT_STATUSES,
      followUpStatuses: FOLLOW_UP_STATUSES,
    },
  };
}

export async function createOutreachProspect(body, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const companyName = String(body.companyName || "").trim();
  if (!companyName) throw new Error("Company name is required");

  const emails = normalizeEmails(body.emails ?? body.email);
  if (!emails.length) throw new Error("At least one email is required");

  const created = await OutreachProspect.create({
    companyName,
    emails,
    nlm: String(body.nlm || "").trim(),
    dateAdded: toEasternDateString(),
    dateReachOut: "",
    reachOutStatus: "",
    dateFollowUp: "",
    followUpStatus: "",
    createdBy: actor,
    updatedBy: actor,
    lastEditedAt: new Date(),
  });

  return normalizeProspect(created.toObject());
}

export async function updateOutreachProspect(id, body, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const existing = await OutreachProspect.findById(id);
  if (!existing) throw new Error("Prospect not found");

  const today = toEasternDateString();
  let touched = false;

  if (body.companyName !== undefined) {
    const companyName = String(body.companyName || "").trim();
    if (!companyName) throw new Error("Company name is required");
    existing.companyName = companyName;
    touched = true;
  }

  if (body.emails !== undefined || body.email !== undefined) {
    const emails = normalizeEmails(body.emails ?? body.email);
    if (!emails.length) throw new Error("At least one email is required");
    existing.emails = emails;
    touched = true;
  }

  if (body.nlm !== undefined) {
    existing.nlm = String(body.nlm || "").trim();
    touched = true;
  }

  if (body.reachOutStatus !== undefined) {
    const next = String(body.reachOutStatus || "").trim();
    if (next && !REACH_OUT_STATUSES.includes(next)) {
      throw new Error(`Invalid reach-out status. Allowed: ${REACH_OUT_STATUSES.join(", ")}`);
    }
    const prev = existing.reachOutStatus || "";
    // First click is open to anyone; only CEO can change/clear after it's set
    if (prev && next !== prev && String(user?.role || "").toLowerCase() !== "ceo") {
      throw new Error("Only CEO can update outreach after it has been set");
    }
    existing.reachOutStatus = next;
    // Auto-stamp reach-out date the first time a real status is set
    if (next && !prev) {
      existing.dateReachOut = today;
      // Default status after first email outreach
      if (!existing.followUpStatus) {
        existing.followUpStatus = "No response";
        existing.dateFollowUp = today;
      }
    }
    // Clearing outreach also clears follow-up (no outreach = no follow-up)
    if (!next) {
      existing.dateReachOut = "";
      existing.followUpStatus = "";
      existing.dateFollowUp = "";
    }
    touched = true;
  }

  if (body.followUpStatus !== undefined) {
    if (!existing.reachOutStatus) {
      throw new Error("Set initial outreach status before follow-up");
    }
    const next = String(body.followUpStatus || "").trim();
    if (next && !FOLLOW_UP_STATUSES.includes(next)) {
      throw new Error(`Invalid follow-up status. Allowed: ${FOLLOW_UP_STATUSES.join(", ")}`);
    }
    const prev = existing.followUpStatus || "";
    existing.followUpStatus = next;
    if (next && !prev) {
      existing.dateFollowUp = today;
    }
    if (!next) {
      existing.dateFollowUp = "";
    }
    touched = true;
  }

  if (!touched) {
    return normalizeProspect(existing.toObject());
  }

  existing.updatedBy = actor;
  existing.lastEditedAt = new Date();
  await existing.save();
  return normalizeProspect(existing.toObject());
}

export async function deleteOutreachProspect(id) {
  requireMongo();
  const deleted = await OutreachProspect.findByIdAndDelete(id).lean();
  if (!deleted) throw new Error("Prospect not found");
  return { deleted: true, id: String(deleted._id) };
}
