import express from "express";

import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";
import { createUser, loginUser, sanitizeUser } from "../services/authService.js";
import { findUserById } from "../services/authService.js";

const router = express.Router();

function validateCredentials(body) {
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }
  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.status = 400;
    throw error;
  }
  return { email, password };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = validateCredentials(req.body);
    const result = await loginUser(email, password);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Login failed" });
  }
});

router.post("/register", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, password } = validateCredentials(req.body);
    const user = await createUser({
      email,
      password,
      name: req.body.name,
      role: req.body.role,
      adAccountIds: req.body.adAccountIds,
      buyerNames: req.body.buyerNames,
    });
    return res.status(201).json({ ok: true, user });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Registration failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load profile" });
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  return res.json({ ok: true, message: "Logged out" });
});

export default router;
