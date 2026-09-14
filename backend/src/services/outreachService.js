import { hasMongoConfig } from "../config.js";
import {
  DEFAULT_FOLLOW_UP_STATUS,
  FOLLOW_UP_STATUSES,
  OutreachProspect,
  REACH_OUT_STATUSES,
} from "../models/OutreachProspect.js";
import { toEasternDateString } from "../utils/dateRange.js";
import { notifyOutreachSlack } from "./slackService.js";

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

function actorLabel(actor = {}) {
  return actor.name || actor.email || "Someone";
}

function normalizeEmails(input) {
  const raw = Array.isArray(input) ? input.join(" ") : String(input || "");
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

function normalizeFormFillUrl(input) {
  const value = String(input || "").trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }
  return value;
}

function migrateLegacyFields(doc) {
  let changed = false;
  if (doc.reachOutStatus === "Emailed") {
    doc.reachOutStatus = "Email";
    changed = true;
  }
  if (doc.followUpStatus === "Responded") {
    doc.followUpStatus = "Currently in communication";
    changed = true;
  }
  return changed;
}

function normalizeNote(note) {
  return {
    id: String(note._id || note.id || ""),
    text: note.text || "",
    createdBy: note.createdBy || { userId: "", name: "", email: "" },
    createdAt: note.createdAt || null,
  };
}

function normalizeProspect(doc) {
  return {
    id: String(doc._id),
    companyName: doc.companyName || "",
    emails: Array.isArray(doc.emails) ? doc.emails : [],
    formFillUrl: doc.formFillUrl || "",
    nlm: doc.nlm || "",
    dateAdded: doc.dateAdded || "",
    dateReachOut: doc.dateReachOut || "",
    reachOutStatus: doc.reachOutStatus || "",
    dateFollowUp: doc.dateFollowUp || "",
    followUpStatus: doc.followUpStatus || "",
    notes: Array.isArray(doc.notes) ? doc.notes.map(normalizeNote) : [],
    noteCount: Array.isArray(doc.notes) ? doc.notes.length : 0,
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
    formFillUrl: "",
    nlm: "",
    dateAdded: row.dateAdded || today,
    dateReachOut: "",
    reachOutStatus: "",
    dateFollowUp: "",
    followUpStatus: "",
    notes: [],
    archived: false,
    createdBy: actor,
    updatedBy: actor,
    lastEditedAt: new Date(),
  }));
  await OutreachProspect.insertMany(docs);
}

async function migrateLegacyProspects() {
  const legacy = await OutreachProspect.find({
    $or: [{ reachOutStatus: "Emailed" }, { followUpStatus: "Responded" }],
  });
  for (const doc of legacy) {
    if (migrateLegacyFields(doc)) {
      await doc.save();
    }
  }
}

function metaPayload() {
  return {
    reachOutStatuses: REACH_OUT_STATUSES,
    followUpStatuses: FOLLOW_UP_STATUSES,
    defaultFollowUpStatus: DEFAULT_FOLLOW_UP_STATUS,
  };
}

export async function listOutreachProspects(user, { archived = false } = {}) {
  requireMongo();
  await ensureSeeded(actorFromUser(user));
  await migrateLegacyProspects();
  const query = archived
    ? { archived: true }
    : { $or: [{ archived: false }, { archived: { $exists: false } }] };
  const rows = await OutreachProspect.find(query)
    .sort({ dateAdded: -1, companyName: 1 })
    .lean();
  return {
    prospects: rows.map(normalizeProspect),
    meta: metaPayload(),
  };
}

export async function createOutreachProspect(body, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const companyName = String(body.companyName || "").trim();
  if (!companyName) throw new Error("Company name is required");

  const emails = normalizeEmails(body.emails ?? body.email);
  if (!emails.length) throw new Error("At least one email is required");

  const formFillUrl = normalizeFormFillUrl(body.formFillUrl);

  const created = await OutreachProspect.create({
    companyName,
    emails,
    formFillUrl,
    nlm: String(body.nlm || "").trim(),
    dateAdded: toEasternDateString(),
    dateReachOut: "",
    reachOutStatus: "",
    dateFollowUp: "",
    followUpStatus: "",
    notes: [],
    archived: false,
    createdBy: actor,
    updatedBy: actor,
    lastEditedAt: new Date(),
  });

  const prospect = normalizeProspect(created.toObject());
  void notifyOutreachSlack(
    `🟢 *New prospect added*\n*${prospect.companyName}* · ${prospect.emails.join(", ")}\nby ${actorLabel(actor)}`
  );
  return prospect;
}

export async function updateOutreachProspect(id, body, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const existing = await OutreachProspect.findById(id);
  if (!existing) throw new Error("Prospect not found");
  migrateLegacyFields(existing);

  const today = toEasternDateString();
  const changes = [];
  let touched = false;

  if (body.companyName !== undefined) {
    const companyName = String(body.companyName || "").trim();
    if (!companyName) throw new Error("Company name is required");
    if (companyName !== existing.companyName) {
      changes.push(`company → ${companyName}`);
      existing.companyName = companyName;
      touched = true;
    }
  }

  if (body.emails !== undefined || body.email !== undefined) {
    const emails = normalizeEmails(body.emails ?? body.email);
    if (!emails.length) throw new Error("At least one email is required");
    const prev = (existing.emails || []).join(", ");
    const next = emails.join(", ");
    if (prev !== next) {
      changes.push(`email → ${next}`);
      existing.emails = emails;
      touched = true;
    }
  }

  if (body.formFillUrl !== undefined) {
    const formFillUrl = normalizeFormFillUrl(body.formFillUrl);
    if (formFillUrl !== (existing.formFillUrl || "")) {
      changes.push(formFillUrl ? "form fill URL updated" : "form fill URL cleared");
      existing.formFillUrl = formFillUrl;
      touched = true;
    }
  }

  if (body.nlm !== undefined) {
    existing.nlm = String(body.nlm || "").trim();
    touched = true;
  }

  if (body.archived !== undefined) {
    const nextArchived = Boolean(body.archived);
    if (nextArchived !== Boolean(existing.archived)) {
      existing.archived = nextArchived;
      if (nextArchived) {
        existing.archivedAt = new Date();
        existing.archivedBy = actor;
        changes.push("archived (not interested)");
      } else {
        existing.archivedAt = null;
        existing.archivedBy = { userId: "", name: "", email: "" };
        changes.push("restored from archive");
      }
      touched = true;
    }
  }

  if (body.reachOutStatus !== undefined) {
    let next = String(body.reachOutStatus || "").trim();
    if (next === "Emailed") next = "Email";
    if (next && !REACH_OUT_STATUSES.includes(next)) {
      throw new Error(`Invalid outreach method. Allowed: ${REACH_OUT_STATUSES.join(", ")}`);
    }
    const prev = existing.reachOutStatus || "";

    if (prev && !next && String(user?.role || "").toLowerCase() !== "ceo") {
      throw new Error("Only CEO can reset outreach to default");
    }

    if (next === "Form Fill" && !normalizeFormFillUrl(body.formFillUrl ?? existing.formFillUrl)) {
      throw new Error("Form Fill URL is required when outreach method is Form Fill");
    }

    if (next !== prev) {
      existing.reachOutStatus = next;
      if (next && !prev) {
        existing.dateReachOut = today;
        if (!existing.followUpStatus) {
          existing.followUpStatus = DEFAULT_FOLLOW_UP_STATUS;
          existing.dateFollowUp = today;
        }
        changes.push(`outreach logged: ${next}`);
      } else if (!next) {
        existing.dateReachOut = "";
        existing.followUpStatus = "";
        existing.dateFollowUp = "";
        changes.push("outreach reset to default");
      } else {
        changes.push(`outreach → ${next}`);
      }
      touched = true;
    }
  }

  if (body.followUpStatus !== undefined) {
    if (!existing.reachOutStatus) {
      throw new Error("Log outreach before setting status");
    }
    let next = String(body.followUpStatus || "").trim();
    if (next === "Responded") next = "Currently in communication";
    if (next && !FOLLOW_UP_STATUSES.includes(next)) {
      throw new Error(`Invalid status. Allowed: ${FOLLOW_UP_STATUSES.join(", ")}`);
    }
    const prev = existing.followUpStatus || "";
    if (next !== prev) {
      existing.followUpStatus = next;
      if (next && !prev) {
        existing.dateFollowUp = today;
      }
      if (!next) {
        existing.dateFollowUp = "";
      }
      changes.push(`status → ${next || "(cleared)"}`);
      touched = true;
    }
  }

  if (!touched) {
    return normalizeProspect(existing.toObject());
  }

  existing.updatedBy = actor;
  existing.lastEditedAt = new Date();
  await existing.save();

  const prospect = normalizeProspect(existing.toObject());
  if (changes.length) {
    void notifyOutreachSlack(
      `📣 *Outreach update* — *${prospect.companyName}*\n${changes.map((c) => `• ${c}`).join("\n")}\nby ${actorLabel(actor)}`
    );
  }
  return prospect;
}

export async function addOutreachNote(id, body, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const text = String(body.text || body.note || "").trim();
  if (!text) throw new Error("Note text is required");

  const existing = await OutreachProspect.findById(id);
  if (!existing) throw new Error("Prospect not found");

  existing.notes.push({
    text,
    createdBy: actor,
    createdAt: new Date(),
  });
  existing.updatedBy = actor;
  existing.lastEditedAt = new Date();
  await existing.save();

  const prospect = normalizeProspect(existing.toObject());
  void notifyOutreachSlack(
    `📝 *Note added* — *${prospect.companyName}*\n>${text.slice(0, 280)}${text.length > 280 ? "…" : ""}\nby ${actorLabel(actor)}`
  );
  return prospect;
}

export async function deleteOutreachProspect(id) {
  requireMongo();
  const deleted = await OutreachProspect.findByIdAndDelete(id).lean();
  if (!deleted) throw new Error("Prospect not found");
  return { deleted: true, id: String(deleted._id) };
}
