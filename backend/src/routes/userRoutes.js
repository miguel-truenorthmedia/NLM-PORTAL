import express from "express";

import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";
import { User } from "../models/User.js";
import { hashPassword, sanitizeUser } from "../services/authService.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ ok: true, users: users.map(sanitizeUser) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: "Access denied" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load user" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: "Access denied" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.body.name !== undefined) {
      user.name = String(req.body.name).trim();
    }

    if (req.body.password) {
      if (String(req.body.password).length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      user.passwordHash = await hashPassword(req.body.password);
    }

    if (isAdmin) {
      if (req.body.role !== undefined) user.role = req.body.role;
      if (req.body.adAccountIds !== undefined) user.adAccountIds = req.body.adAccountIds;
      if (req.body.buyerNames !== undefined) user.buyerNames = req.body.buyerNames;
      if (req.body.active !== undefined) user.active = Boolean(req.body.active);
    }

    await user.save();
    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to update user" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ ok: true, message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to delete user" });
  }
});

export default router;
