import { User } from "../models/User.js";
import { INVITE_TTL_MS, UserInvite } from "../models/UserInvite.js";
import { createUser, findUserByEmail, findUserById, hashPassword, sanitizeUser } from "./authService.js";

const ROLES = ["admin", "ceo", "media_buyer"];

function actorFromUser(user) {
  if (!user) return { userId: "", name: "", email: "" };
  return {
    userId: String(user._id || user.id || ""),
    name: String(user.name || user.email || "").trim(),
    email: String(user.email || "").trim().toLowerCase(),
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function assertRole(role) {
  const value = String(role || "").trim();
  if (!ROLES.includes(value)) {
    const error = new Error(`Invalid role. Allowed: ${ROLES.join(", ")}`);
    error.status = 400;
    throw error;
  }
  return value;
}

export function inviteEffectiveStatus(invite, now = new Date()) {
  if (!invite) return "invalid";
  if (invite.status === "used") return "used";
  if (invite.status === "revoked") return "revoked";
  if (invite.expiresAt && new Date(invite.expiresAt) <= now) return "expired";
  return "pending";
}

function serializeInvite(invite, { includeToken = false } = {}) {
  const status = inviteEffectiveStatus(invite);
  return {
    id: String(invite._id),
    type: invite.type,
    email: invite.email,
    role: invite.role,
    userId: invite.userId ? String(invite.userId) : null,
    status,
    expiresAt: invite.expiresAt,
    usedAt: invite.usedAt,
    createdAt: invite.createdAt,
    createdBy: invite.createdBy || {},
    ...(includeToken ? { token: invite.token } : {}),
  };
}

async function revokePendingForEmail(email, type) {
  await UserInvite.updateMany(
    { email, type, status: "pending" },
    { $set: { status: "revoked" } }
  );
}

async function countCeosExcluding(userId) {
  const query = { role: "ceo", active: true };
  if (userId) query._id = { $ne: userId };
  return User.countDocuments(query);
}

export async function createInviteLink({ email, role }, ceoUser) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    const error = new Error("A valid company email is required");
    error.status = 400;
    throw error;
  }

  const chosenRole = assertRole(role);
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    const error = new Error("A user with this email already exists. Use password reset instead.");
    error.status = 409;
    throw error;
  }

  await revokePendingForEmail(normalizedEmail, "invite");

  const invite = await UserInvite.create({
    token: UserInvite.createTokenValue(),
    type: "invite",
    email: normalizedEmail,
    role: chosenRole,
    status: "pending",
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    createdBy: actorFromUser(ceoUser),
  });

  return serializeInvite(invite, { includeToken: true });
}

export async function createPasswordResetLink(userId, ceoUser) {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  await revokePendingForEmail(user.email, "password_reset");

  const invite = await UserInvite.create({
    token: UserInvite.createTokenValue(),
    type: "password_reset",
    email: user.email,
    role: user.role,
    userId: user._id,
    status: "pending",
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    createdBy: actorFromUser(ceoUser),
  });

  return serializeInvite(invite, { includeToken: true });
}

export async function listUsersAndInvites() {
  const [users, invites] = await Promise.all([
    User.find().sort({ createdAt: -1 }),
    UserInvite.find({ type: "invite" }).sort({ createdAt: -1 }).limit(100),
  ]);

  return {
    users: users.map(sanitizeUser),
    invites: invites.map((row) => serializeInvite(row)),
    meta: { roles: ROLES, inviteTtlHours: 24 },
  };
}

export async function peekInviteToken(token) {
  const invite = await UserInvite.findOne({ token: String(token || "").trim() });
  if (!invite) {
    const error = new Error("Invite link not found");
    error.status = 404;
    throw error;
  }

  const status = inviteEffectiveStatus(invite);
  if (status !== "pending") {
    const error = new Error(
      status === "used"
        ? "This invite link was already used"
        : status === "expired"
          ? "This invite link has expired"
          : "This invite link is no longer valid"
    );
    error.status = 410;
    throw error;
  }

  return {
    type: invite.type,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    status,
  };
}

export async function acceptInvite(token, { password, name } = {}) {
  if (!password || String(password).length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.status = 400;
    throw error;
  }

  const invite = await UserInvite.findOne({ token: String(token || "").trim(), type: "invite" });
  if (!invite) {
    const error = new Error("Invite link not found");
    error.status = 404;
    throw error;
  }

  const status = inviteEffectiveStatus(invite);
  if (status !== "pending") {
    const error = new Error(
      status === "used"
        ? "This invite link was already used"
        : status === "expired"
          ? "This invite link has expired"
          : "This invite link is no longer valid"
    );
    error.status = 410;
    throw error;
  }

  const existing = await findUserByEmail(invite.email);
  if (existing) {
    invite.status = "revoked";
    await invite.save();
    const error = new Error("A user with this email already exists");
    error.status = 409;
    throw error;
  }

  const user = await createUser({
    email: invite.email,
    password,
    name: name || invite.email.split("@")[0],
    role: invite.role,
  });

  invite.status = "used";
  invite.usedAt = new Date();
  invite.userId = user._id || user.id;
  await invite.save();

  return user;
}

export async function acceptPasswordReset(token, { password } = {}) {
  if (!password || String(password).length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.status = 400;
    throw error;
  }

  const invite = await UserInvite.findOne({
    token: String(token || "").trim(),
    type: "password_reset",
  });
  if (!invite) {
    const error = new Error("Reset link not found");
    error.status = 404;
    throw error;
  }

  const status = inviteEffectiveStatus(invite);
  if (status !== "pending") {
    const error = new Error(
      status === "used"
        ? "This reset link was already used"
        : status === "expired"
          ? "This reset link has expired"
          : "This reset link is no longer valid"
    );
    error.status = 410;
    throw error;
  }

  const user = await findUserById(invite.userId);
  if (!user || !user.active) {
    invite.status = "revoked";
    await invite.save();
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  user.passwordHash = await hashPassword(password);
  await user.save();

  invite.status = "used";
  invite.usedAt = new Date();
  await invite.save();

  // Revoke any other pending resets for this user
  await UserInvite.updateMany(
    { type: "password_reset", userId: user._id, status: "pending", _id: { $ne: invite._id } },
    { $set: { status: "revoked" } }
  );

  return sanitizeUser(user);
}

export async function updateUserAsCeo(targetId, body, ceoUser) {
  const user = await findUserById(targetId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (body.role !== undefined) {
    const nextRole = assertRole(body.role);
    if (user.role === "ceo" && nextRole !== "ceo") {
      const otherCeos = await countCeosExcluding(user._id);
      if (otherCeos === 0) {
        const error = new Error("Cannot demote the last CEO");
        error.status = 400;
        throw error;
      }
    }
    user.role = nextRole;
  }

  if (body.active !== undefined) {
    const nextActive = Boolean(body.active);
    if (user.role === "ceo" && user.active && !nextActive) {
      const otherCeos = await countCeosExcluding(user._id);
      if (otherCeos === 0) {
        const error = new Error("Cannot deactivate the last CEO");
        error.status = 400;
        throw error;
      }
    }
    user.active = nextActive;
  }

  if (body.name !== undefined) {
    user.name = String(body.name || "").trim();
  }

  if (body.adAccountIds !== undefined) user.adAccountIds = body.adAccountIds;
  if (body.buyerNames !== undefined) user.buyerNames = body.buyerNames;

  await user.save();
  return sanitizeUser(user);
}

export async function deleteUserAsCeo(targetId, ceoUser) {
  if (String(ceoUser._id || ceoUser.id) === String(targetId)) {
    const error = new Error("You cannot delete your own account");
    error.status = 400;
    throw error;
  }

  const user = await findUserById(targetId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (user.role === "ceo") {
    const otherCeos = await countCeosExcluding(user._id);
    if (otherCeos === 0) {
      const error = new Error("Cannot delete the last CEO");
      error.status = 400;
      throw error;
    }
  }

  await User.findByIdAndDelete(targetId);
  await UserInvite.updateMany(
    { email: user.email, status: "pending" },
    { $set: { status: "revoked" } }
  );

  return { ok: true, message: "User deleted" };
}
