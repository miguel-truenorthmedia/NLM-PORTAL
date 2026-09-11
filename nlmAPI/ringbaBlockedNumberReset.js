import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import {
  PERMANENT_BLOCKED_NUMBERS,
  isPermanentlyBlocked,
  normalizePhoneDigits,
  toE164,
} from "./permanentBlockedNumbers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const BASE_URL = "https://api.ringba.com/v2";
const RINGBA_ACCOUNT_ID = process.env.RINGBA_ACCOUNT_ID;
const API_TOKEN = process.env.RINGBA_API_TOKEN;
const USERNAME = process.env.RINGBA_USERNAME;
const PASSWORD = process.env.RINGBA_PASSWORD;
const SLACK_WEBHOOK_URL =
  process.env.SLACK_RINGBA_WEBHOOK_URL || process.env.SLACK_BLOCKED_RESET_WEBHOOK_URL || "";

/** Parallel DELETE concurrency — keep modest to avoid Ringba rate limits. */
const DELETE_CONCURRENCY = Number(process.env.BLOCKED_RESET_CONCURRENCY || 5);

async function getAuthToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", USERNAME);
  params.append("password", PASSWORD);
  const response = await axios.post(`${BASE_URL}/token`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
  });
  return response.data?.access_token ?? null;
}

async function getAuthorizationToken() {
  if (API_TOKEN) return API_TOKEN;
  if (USERNAME && PASSWORD) return getAuthToken();
  return null;
}

function ringbaAuthHeaders(token) {
  return {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function fetchAllBlockedNumbers(token) {
  const response = await axios.get(`${BASE_URL}/${RINGBA_ACCOUNT_ID}/blockedNumbers`, {
    headers: ringbaAuthHeaders(token),
    timeout: 120_000,
  });
  const rows = Array.isArray(response.data)
    ? response.data
    : response.data?.blockedNumbers || response.data?.records || [];
  return Array.isArray(rows) ? rows : [];
}

async function deleteBlockedNumberById(token, id) {
  await axios.delete(`${BASE_URL}/${RINGBA_ACCOUNT_ID}/blockedNumbers/${id}`, {
    headers: ringbaAuthHeaders(token),
    timeout: 30_000,
  });
}

/**
 * Group rows by digit-normalized phone.
 * Keep the oldest enabled entry as the "keeper" when deduping.
 */
function groupByPhone(rows) {
  const map = new Map();
  for (const row of rows) {
    const phone = toE164(row?.phoneNumber || row?.phone_number || row?.e164Number || "");
    const digits = normalizePhoneDigits(phone);
    if (!digits || !row?.id) continue;
    if (!map.has(digits)) map.set(digits, []);
    map.get(digits).push(row);
  }

  for (const list of map.values()) {
    list.sort((a, b) => String(a.createdDate || "").localeCompare(String(b.createdDate || "")));
  }
  return map;
}

/**
 * Plan:
 * 1) Dedupe — delete extras so each phone has 1 row
 * 2) Unblock — delete the remaining row unless permanently blocked
 */
export function buildResetPlan(rows, permanentList = PERMANENT_BLOCKED_NUMBERS) {
  const groups = groupByPhone(rows);
  const plan = {
    totalRows: rows.length,
    uniquePhones: groups.size,
    permanentKept: [],
    dedupeDeletes: [],
    unblockDeletes: [],
  };

  for (const [digits, list] of groups.entries()) {
    const phone = toE164(digits);
    const permanent = isPermanentlyBlocked(phone, permanentList);
    const [keeper, ...duplicates] = list;

    for (const dup of duplicates) {
      plan.dedupeDeletes.push({
        id: dup.id,
        phone,
        createdDate: dup.createdDate || null,
        reason: "duplicate",
      });
    }

    if (permanent) {
      plan.permanentKept.push({
        id: keeper.id,
        phone,
        createdDate: keeper.createdDate || null,
        duplicateCountRemoved: duplicates.length,
      });
    } else {
      plan.unblockDeletes.push({
        id: keeper.id,
        phone,
        createdDate: keeper.createdDate || null,
        reason: "reset_unblock",
      });
    }
  }

  return plan;
}

async function runPool(items, concurrency, worker) {
  const results = [];
  let index = 0;

  async function next() {
    while (index < items.length) {
      const current = index++;
      const item = items[current];
      try {
        await worker(item);
        results.push({ ok: true, item });
      } catch (error) {
        results.push({
          ok: false,
          item,
          error: error.response?.data || error.message || String(error),
        });
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => next());
  await Promise.all(workers);
  return results;
}

async function postSlackNotification(summary) {
  if (!SLACK_WEBHOOK_URL) {
    return { skipped: true, reason: "webhook_not_configured" };
  }

  const lines = [
    `*Ringba blocked-number reset*`,
    `Mode: ${summary.dryRun ? "dry-run" : "live"}`,
    `Rows before: ${summary.totalRows} → unique phones: ${summary.uniquePhones}`,
    `Duplicates removed: ${summary.dedupeDeleted}/${summary.dedupePlanned}`,
    `Unblocked: ${summary.unblocked}/${summary.unblockPlanned}`,
    `Permanent kept: ${summary.permanentKept}`,
    summary.failures ? `Failures: ${summary.failures}` : null,
  ].filter(Boolean);

  await axios.post(
    SLACK_WEBHOOK_URL,
    { text: lines.join("\n") },
    { headers: { "Content-Type": "application/json" }, timeout: 15_000 }
  );
  return { skipped: false };
}

export async function runBlockedNumberReset({ dryRun = false } = {}) {
  const token = await getAuthorizationToken();
  if (!token) {
    throw new Error("Missing Ringba token (RINGBA_API_TOKEN or username/password)");
  }
  if (!RINGBA_ACCOUNT_ID) {
    throw new Error("Missing RINGBA_ACCOUNT_ID");
  }

  const startedAt = Date.now();
  const rows = await fetchAllBlockedNumbers(token);
  const plan = buildResetPlan(rows);

  console.log("ringbaBlockedNumberReset — plan");
  console.log("  total rows:", plan.totalRows);
  console.log("  unique phones:", plan.uniquePhones);
  console.log("  permanent kept:", plan.permanentKept.length);
  console.log("  dedupe deletes:", plan.dedupeDeletes.length);
  console.log("  unblock deletes:", plan.unblockDeletes.length);
  console.log("  dry-run:", dryRun);

  if (plan.permanentKept.length) {
    console.log("  permanent numbers:");
    for (const row of plan.permanentKept) {
      console.log(`    keep ${row.phone} (id=${row.id}, removed ${row.duplicateCountRemoved} dups)`);
    }
  }

  let dedupeResults = [];
  let unblockResults = [];

  if (!dryRun) {
    // Step 1 — remove duplicates first
    console.log("Step 1: removing duplicates...");
    dedupeResults = await runPool(plan.dedupeDeletes, DELETE_CONCURRENCY, async (item) => {
      await deleteBlockedNumberById(token, item.id);
    });

    // Step 2 — unblock remaining non-permanent unique numbers
    console.log("Step 2: unblocking unique non-permanent numbers...");
    unblockResults = await runPool(plan.unblockDeletes, DELETE_CONCURRENCY, async (item) => {
      await deleteBlockedNumberById(token, item.id);
    });
  }

  const dedupeFailed = dedupeResults.filter((r) => !r.ok);
  const unblockFailed = unblockResults.filter((r) => !r.ok);
  const summary = {
    dryRun,
    totalRows: plan.totalRows,
    uniquePhones: plan.uniquePhones,
    permanentKept: plan.permanentKept.length,
    permanentNumbers: plan.permanentKept.map((r) => r.phone),
    dedupePlanned: plan.dedupeDeletes.length,
    dedupeDeleted: dryRun ? 0 : dedupeResults.filter((r) => r.ok).length,
    unblockPlanned: plan.unblockDeletes.length,
    unblocked: dryRun ? 0 : unblockResults.filter((r) => r.ok).length,
    failures: dedupeFailed.length + unblockFailed.length,
    durationMs: Date.now() - startedAt,
  };

  if (dedupeFailed.length || unblockFailed.length) {
    console.warn("Some deletes failed:");
    for (const row of [...dedupeFailed, ...unblockFailed].slice(0, 20)) {
      console.warn(" ", row.item?.phone, row.item?.id, row.error);
    }
  }

  let slack;
  try {
    slack = await postSlackNotification(summary);
  } catch (error) {
    slack = { skipped: false, error: error.message || String(error) };
    console.warn("Slack notification failed:", slack.error);
  }

  console.log("ringbaBlockedNumberReset — done", summary, "slack:", slack);
  return { ...summary, slack, permanentNumbers: summary.permanentNumbers };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const dryRun =
    process.argv.includes("--dry-run") ||
    String(process.env.BLOCKED_RESET_DRY_RUN || "").toLowerCase() === "true";

  runBlockedNumberReset({ dryRun }).catch((error) => {
    console.error("❌ ringbaBlockedNumberReset failed:", error.response?.data || error);
    process.exit(1);
  });
}
