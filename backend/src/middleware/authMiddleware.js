import { verifyToken, findUserById, sanitizeUser } from "../services/authService.js";
import { isTodoOwner } from "../utils/todoOwner.js";

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

export async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.user = sanitizeUser(user);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
}

/** Admin or CEO — for financial integrations like QuickBooks */
export function requireAdminOrCeo(req, res, next) {
  const role = String(req.user?.role || "").toLowerCase();
  if (!req.user || (role !== "admin" && role !== "ceo")) {
    return res.status(403).json({ error: "Admin or CEO access required" });
  }
  return next();
}

export function requireCeo(req, res, next) {
  if (!req.user || String(req.user.role || "").toLowerCase() !== "ceo") {
    return res.status(403).json({ error: "CEO access required" });
  }
  return next();
}

/** Block media buyers from ops APIs (accounting / sales). */
export function forbidMediaBuyer(req, res, next) {
  if (String(req.user?.role || "").toLowerCase() === "media_buyer") {
    return res.status(403).json({ error: "Access denied" });
  }
  return next();
}

/** Personal Todo page — CEO whose name is Miguel only */
export function requireTodoOwner(req, res, next) {
  if (!isTodoOwner(req.user)) {
    return res.status(403).json({ error: "Todo access denied" });
  }
  return next();
}
