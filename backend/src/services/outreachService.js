import { hasMongoConfig } from "../config.js";
import {
  DEFAULT_FOLLOW_UP_STATUS,
  FOLLOW_UP_STATUSES,
  OutreachProspect,
  PIPELINE_STALE_DAYS,
  REACH_OUT_STATUSES,
} from "../models/OutreachProspect.js";
import { toEasternDateString } from "../utils/dateRange.js";
import { notifyAccountingSlack, notifyOutreachSlack } from "./slackService.js";

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

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

/** Map legacy follow-up labels → current set. Returns { status, changed }. */
function mapLegacyFollowUpStatus(status) {
  const value = String(status || "").trim();
  if (!value) return { status: "", changed: false };

  const map = {
    Responded: "In Communication",
    "Currently in communication": "In Communication",
    "Accepted our business": "Accepted",
    "Declined our business": "Declined/not interested",
    "Continuing attempt at outreach": "Awaiting response",
    "No response": "Awaiting response",
  };

  if (map[value]) {
    return { status: map[value], changed: true };
  }
  if (FOLLOW_UP_STATUSES.includes(value) || value === "Awaiting response") {
    return { status: value, changed: false };
  }
  return { status: value, changed: false };
}

function migrateLegacyFields(doc) {
  let changed = false;
  if (doc.reachOutStatus === "Emailed") {
    doc.reachOutStatus = "Email";
    changed = true;
  }

  const mapped = mapLegacyFollowUpStatus(doc.followUpStatus);
  if (mapped.changed) {
    doc.followUpStatus = mapped.status;
    changed = true;
  }

  if (!doc.pipelineBucket || !["active", "no_response", "follow_up", "accepted"].includes(doc.pipelineBucket)) {
    doc.pipelineBucket = "active";
    changed = true;
  }

  // Accepted lives on its own tab
  if (doc.followUpStatus === "Accepted" && !doc.archived && doc.pipelineBucket !== "accepted") {
    doc.pipelineBucket = "accepted";
    clearTimingFields(doc);
    changed = true;
  }

  // Start 7-day clock from today for awaiting leads that never had awaitingSince
  if (
    doc.followUpStatus === "Awaiting response" &&
    !doc.archived &&
    !doc.awaitingSince &&
    doc.pipelineBucket === "active"
  ) {
    doc.awaitingSince = new Date();
    changed = true;
  }

  // Declined must live in Archive (covers legacy rows that only got a status rename)
  if (doc.followUpStatus === "Declined/not interested" && !doc.archived) {
    doc.archived = true;
    doc.archivedAt = doc.archivedAt || new Date();
    clearTimingFields(doc);
    changed = true;
  }

  return changed;
}

function clearTimingFields(doc) {
  doc.awaitingSince = null;
  doc.noResponseSince = null;
}

function applyStatusSideEffects(doc, nextStatus, actor) {
  const prev = doc.followUpStatus || "";

  if (nextStatus === "Awaiting response") {
    doc.awaitingSince = new Date();
    doc.noResponseSince = null;
    if (!doc.archived) {
      doc.pipelineBucket = "active";
    }
    return;
  }

  if (nextStatus === "In Communication") {
    clearTimingFields(doc);
    if (!doc.archived) {
      doc.pipelineBucket = "active";
    }
    return;
  }

  if (nextStatus === "Declined/not interested") {
    clearTimingFields(doc);
    doc.archived = true;
    doc.archivedAt = new Date();
    doc.archivedBy = actor;
    return;
  }

  if (nextStatus === "Accepted") {
    clearTimingFields(doc);
    if (!doc.archived) {
      doc.pipelineBucket = "accepted";
    }
    return;
  }

  // Cleared ("")
  if (prev === "Awaiting response" || nextStatus === "") {
    clearTimingFields(doc);
  }
  if (!doc.archived && nextStatus === "") {
    doc.pipelineBucket = "active";
  }
}

function normalizeNote(note) {
  return {
    id: String(note._id || note.id || ""),
    text: note.text || "",
    ignored: Boolean(note.ignored),
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
    pipelineBucket: doc.pipelineBucket || "active",
    awaitingSince: doc.awaitingSince || null,
    noResponseSince: doc.noResponseSince || null,
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

/** Process-local caches so list requests don't pay migration/seed/advance every time */
let seedReady = false;
let migrationReady = false;
let advanceInFlight = false;
let lastAdvanceAt = 0;
/** Backup advance while browsing — cron still owns the daily pass */
const ADVANCE_MIN_INTERVAL_MS = 15 * 60 * 1000;

async function ensureSeeded(actor) {
  if (seedReady) return;
  const any = await OutreachProspect.exists({});
  if (any) {
    seedReady = true;
    return;
  }

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
    pipelineBucket: "active",
    awaitingSince: null,
    noResponseSince: null,
    notes: [],
    archived: false,
    createdBy: actor,
    updatedBy: actor,
    lastEditedAt: new Date(),
  }));
  await OutreachProspect.insertMany(docs);
  seedReady = true;
}

async function migrateLegacyProspects() {
  if (migrationReady) return;

  await Promise.all([
    OutreachProspect.updateMany(
      {
        archived: { $ne: true },
        $or: [{ pipelineBucket: { $exists: false } }, { pipelineBucket: null }, { pipelineBucket: "" }],
      },
      { $set: { pipelineBucket: "active" } }
    ),
    OutreachProspect.updateMany(
      {
        followUpStatus: { $in: ["Declined/not interested", "Declined our business"] },
        archived: { $ne: true },
      },
      {
        $set: {
          followUpStatus: "Declined/not interested",
          archived: true,
          archivedAt: new Date(),
          awaitingSince: null,
          noResponseSince: null,
        },
      }
    ),
    OutreachProspect.updateMany(
      {
        followUpStatus: { $in: ["Accepted", "Accepted our business"] },
        archived: { $ne: true },
        pipelineBucket: { $ne: "accepted" },
      },
      {
        $set: {
          followUpStatus: "Accepted",
          pipelineBucket: "accepted",
          awaitingSince: null,
          noResponseSince: null,
        },
      }
    ),
  ]);

  const legacy = await OutreachProspect.find({
    $or: [
      { reachOutStatus: "Emailed" },
      {
        followUpStatus: {
          $in: [
            "Responded",
            "Currently in communication",
            "Accepted our business",
            "Declined our business",
            "Continuing attempt at outreach",
            "No response",
          ],
        },
      },
      {
        followUpStatus: "Awaiting response",
        awaitingSince: null,
        archived: { $ne: true },
        pipelineBucket: "active",
      },
    ],
  });
  for (const doc of legacy) {
    if (migrateLegacyFields(doc)) {
      await doc.save();
    }
  }

  migrationReady = true;
}

/**
 * Auto-advance stale prospects:
 * - Awaiting + active + awaitingSince ≥ 7d → no_response
 * - no_response + noResponseSince ≥ 7d → follow_up
 */
export async function advanceStaleProspects() {
  requireMongo();
  const cutoff = new Date(Date.now() - PIPELINE_STALE_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [toNoResponse, toFollowUp] = await Promise.all([
    OutreachProspect.updateMany(
      {
        archived: { $ne: true },
        followUpStatus: "Awaiting response",
        pipelineBucket: "active",
        awaitingSince: { $ne: null, $lte: cutoff },
      },
      {
        $set: {
          pipelineBucket: "no_response",
          noResponseSince: now,
        },
      }
    ),
    OutreachProspect.updateMany(
      {
        archived: { $ne: true },
        pipelineBucket: "no_response",
        noResponseSince: { $ne: null, $lte: cutoff },
      },
      {
        $set: {
          pipelineBucket: "follow_up",
        },
      }
    ),
  ]);

  lastAdvanceAt = Date.now();
  return {
    movedToNoResponse: toNoResponse.modifiedCount || 0,
    movedToFollowUp: toFollowUp.modifiedCount || 0,
  };
}

/** Non-blocking, throttled — list pages must not wait on pipeline writes */
function scheduleAdvanceIfDue() {
  const now = Date.now();
  if (advanceInFlight) return;
  if (now - lastAdvanceAt < ADVANCE_MIN_INTERVAL_MS) return;
  advanceInFlight = true;
  lastAdvanceAt = now;
  advanceStaleProspects()
    .catch((error) => {
      console.warn("Background outreach pipeline advance failed:", error.message);
    })
    .finally(() => {
      advanceInFlight = false;
    });
}

function metaPayload() {
  return {
    reachOutStatuses: REACH_OUT_STATUSES,
    followUpStatuses: FOLLOW_UP_STATUSES,
    defaultFollowUpStatus: DEFAULT_FOLLOW_UP_STATUS,
    pipelineStaleDays: PIPELINE_STALE_DAYS,
  };
}

function resolveView({ archived = false, view } = {}) {
  const raw = String(view || "").trim().toLowerCase();
  if (
    archived === true ||
    raw === "archived" ||
    raw === "archive"
  ) {
    return "archived";
  }
  if (raw === "no_response" || raw === "no-response") return "no_response";
  if (raw === "follow_up" || raw === "follow-up") return "follow_up";
  if (raw === "accepted") return "accepted";
  return "active";
}

export async function listOutreachProspects(user, options = {}) {
  requireMongo();
  const actor = actorFromUser(user);
  // First hit after process start may migrate once; later hits are a single find
  await ensureSeeded(actor);
  await migrateLegacyProspects();
  scheduleAdvanceIfDue();

  const resolvedView = resolveView(options);
  let query;
  if (resolvedView === "archived") {
    query = { archived: true };
  } else if (resolvedView === "active") {
    query = {
      archived: { $ne: true },
      pipelineBucket: "active",
    };
  } else if (resolvedView === "accepted") {
    query = {
      archived: { $ne: true },
      pipelineBucket: "accepted",
      followUpStatus: "Accepted",
    };
  } else {
    query = {
      archived: { $ne: true },
      pipelineBucket: resolvedView,
    };
  }

  const rows = await OutreachProspect.find(query)
    .sort({ dateAdded: -1, companyName: 1 })
    .lean();
  return {
    prospects: rows.map(normalizeProspect),
    meta: metaPayload(),
    view: resolvedView,
  };
}

/** Call once at boot so the first user request isn't the warm-up tax */
export async function warmOutreachCaches() {
  requireMongo();
  await ensureSeeded({ userId: "", name: "System", email: "" });
  await migrateLegacyProspects();
}

export async function createOutreachProspect(body, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const companyName = String(body.companyName || "").trim();
  if (!companyName) throw new Error("Company name is required");

  const emails = normalizeEmails(body.emails ?? body.email);

  const formFillUrl = normalizeFormFillUrl(body.formFillUrl);

  const duplicate = await OutreachProspect.findOne({
    companyName: { $regex: `^${escapeRegex(companyName)}$`, $options: "i" },
  }).lean();
  if (duplicate) {
    throw new Error(
      `"${duplicate.companyName}" is already on the sheet. Select it from the suggestions to update.`
    );
  }

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
    pipelineBucket: "active",
    awaitingSince: null,
    noResponseSince: null,
    notes: [],
    archived: false,
    createdBy: actor,
    updatedBy: actor,
    lastEditedAt: new Date(),
  });

  const prospect = normalizeProspect(created.toObject());
  void notifyOutreachSlack(
    `${actorLabel(actor)} added ${prospect.companyName} as new prospect`
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
  let outreachLogged = false;
  let acceptedForOnboarding = false;

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
    const prev = (existing.emails || []).join(", ");
    const next = emails.join(", ");
    if (prev !== next) {
      changes.push(next ? `email → ${next}` : "email cleared");
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
        clearTimingFields(existing);
        changes.push("archived (not interested)");
      } else {
        existing.archivedAt = null;
        existing.archivedBy = { userId: "", name: "", email: "" };
        existing.pipelineBucket = "active";
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
          applyStatusSideEffects(existing, DEFAULT_FOLLOW_UP_STATUS, actor);
        }
        changes.push(`outreach logged: ${next}`);
        outreachLogged = true;
      } else if (!next) {
        existing.dateReachOut = "";
        existing.followUpStatus = "";
        existing.dateFollowUp = "";
        clearTimingFields(existing);
        existing.pipelineBucket = "active";
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
    const mapped = mapLegacyFollowUpStatus(next);
    next = mapped.status;
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
      applyStatusSideEffects(existing, next, actor);
      if (next === "Accepted") {
        acceptedForOnboarding = true;
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
  // Slack: only when outreach is first logged (not edits / archive / status tweaks)
  if (outreachLogged) {
    void notifyOutreachSlack(
      `${actorLabel(actor)} sent an outreach to ${prospect.companyName}`
    );
  }
  if (acceptedForOnboarding) {
    void notifyAccountingSlack(`${prospect.companyName} ready for onboarding`);
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
    ignored: false,
    createdBy: actor,
    createdAt: new Date(),
  });
  existing.updatedBy = actor;
  existing.lastEditedAt = new Date();
  await existing.save();

  const prospect = normalizeProspect(existing.toObject());
  return prospect;
}

export async function setOutreachNoteIgnored(id, noteId, ignored, user) {
  requireMongo();
  const actor = actorFromUser(user);
  const noteKey = String(noteId || "").trim();
  if (!noteKey) throw new Error("Note id is required");

  const existing = await OutreachProspect.findById(id);
  if (!existing) throw new Error("Prospect not found");

  let note = null;
  if (typeof existing.notes.id === "function") {
    note = existing.notes.id(noteKey);
  }
  if (!note) {
    note = existing.notes.find((n) => String(n._id) === noteKey || String(n.id) === noteKey);
  }
  if (!note) throw new Error("Note not found");

  note.ignored = Boolean(ignored);
  existing.updatedBy = actor;
  existing.lastEditedAt = new Date();
  existing.markModified("notes");
  await existing.save();

  return normalizeProspect(existing.toObject());
}

export async function deleteOutreachProspect(id) {
  requireMongo();
  const deleted = await OutreachProspect.findByIdAndDelete(id).lean();
  if (!deleted) throw new Error("Prospect not found");
  return { deleted: true, id: String(deleted._id) };
}
