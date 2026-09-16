/**
 * Numbers that must never be cleared by the bi-monthly blocked-number reset.
 * Keep E.164 (+1XXXXXXXXXX). Add more as needed.
 */
export const PERMANENT_BLOCKED_NUMBERS = [
  "+14243542255",
  "+15122901700",
  "+12086819826",
  "+12085227041",
  "+12085229897",
  "+12085347865",
  "+14068028347",
];

/** Digits-only compare key (handles formatting differences). */
export function normalizePhoneDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

/** Canonical E.164-ish display: leading + if digits present. */
export function toE164(value = "") {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "";
  return `+${digits}`;
}

export function isPermanentlyBlocked(phone, permanentList = PERMANENT_BLOCKED_NUMBERS) {
  const needle = normalizePhoneDigits(phone);
  if (!needle) return false;
  return permanentList.some((entry) => normalizePhoneDigits(entry) === needle);
}
