import express from "express";

import { requireAuth, requireCeo } from "../middleware/authMiddleware.js";
import { User } from "../models/User.js";
import { hashPassword, sanitizeUser } from "../services/authService.js";
import {
  createInviteLink,
  createPasswordResetLink,
  deleteUserAsCeo,
  listUsersAndInvites,
  updateUserAsCeo,
} from "../services/inviteService.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requireCeo, async (_req, res) => {
  try {
    const payload = await listUsersAndInvites();
    return res.json({ ok: true, ...payload });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load users" });
  }
});

router.post("/invites", requireCeo, async (req, res) => {
  try {
    const invite = await createInviteLink(
      { email: req.body.email, role: req.body.role },
      req.user
    );
    return res.status(201).json({ ok: true, invite });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Failed to create invite" });
  }
});

router.post("/:id/password-reset", requireCeo, async (req, res) => {
  try {
    const invite = await createPasswordResetLink(req.params.id, req.user);
    return res.status(201).json({ ok: true, invite });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Failed to create reset link" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const isCeo = String(req.user.role || "").toLowerCase() === "ceo";
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isCeo && !isSelf) {
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
    const isCeo = String(req.user.role || "").toLowerCase() === "ceo";
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isCeo && !isSelf) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (isCeo && (req.body.role !== undefined || req.body.active !== undefined || !isSelf)) {
      const user = await updateUserAsCeo(req.params.id, req.body, req.user);
      return res.json({ ok: true, user });
    }

    // Self-service: name + password only
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

    await user.save();
    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Failed to update user" });
  }
});

router.delete("/:id", requireCeo, async (req, res) => {
  try {
    const result = await deleteUserAsCeo(req.params.id, req.user);
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Failed to delete user" });
  }
});

export default router;
