import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { config } from "../config.js";
import { User } from "../models/User.js";

const SALT_ROUNDS = 12;

export function sanitizeUser(user) {
  if (!user) return null;
  const doc = user.toObject ? user.toObject() : user;
  const { passwordHash, ...safe } = doc;
  return safe;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase().trim() });
}

export async function findUserById(id) {
  return User.findById(id);
}

export async function createUser({ email, password, name, role, adAccountIds, buyerNames }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const error = new Error("A user with this email already exists");
    error.status = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    name: name?.trim() || "",
    role: role || "media_buyer",
    adAccountIds: adAccountIds || [],
    buyerNames: buyerNames || [],
  });

  return sanitizeUser(user);
}

export async function loginUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const token = signToken(user);
  return { token, user: sanitizeUser(user) };
}
