import { verifyToken, findUserById, sanitizeUser } from "../services/authService.js";

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
