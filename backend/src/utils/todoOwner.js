/**
 * Todo page is personal to Miguel (CEO).
 * Match first name "Miguel" (case-insensitive) + role ceo.
 */
export function isTodoOwner(user) {
  if (!user) return false;
  if (String(user.role || "").toLowerCase() !== "ceo") return false;

  const name = String(user.name || "").trim().toLowerCase();
  const first = name.split(/\s+/).filter(Boolean)[0] || "";
  if (first === "miguel") return true;

  const email = String(user.email || "").trim().toLowerCase();
  if (email.startsWith("miguel@") || email.startsWith("miguel.")) return true;

  return false;
}
