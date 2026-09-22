import crypto from "crypto";
import axios from "axios";
import { config, hasQuickBooksAppConfig } from "../config.js";
import { QuickBooksConnection } from "../models/QuickBooksConnection.js";
import { QuickBooksOAuthState } from "../models/QuickBooksOAuthState.js";

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const AUTHORIZE_URL = "https://appcenter.intuit.com/connect/oauth2";
const ACCOUNTING_SCOPE = "com.intuit.quickbooks.accounting";
const STATE_TTL_MS = 10 * 60 * 1000;

function assertAppConfigured() {
  if (!hasQuickBooksAppConfig) {
    throw new Error(
      "QuickBooks app is not configured. Set QBO_CLIENT_ID and QBO_CLIENT_SECRET."
    );
  }
  if (!config.qboRedirectUri) {
    throw new Error(
      "QBO_REDIRECT_URI is not set. Register the same URI in Intuit Developer and backend/.env."
    );
  }
}

function currentEnvironment() {
  return config.qboEnvironment === "production" ? "production" : "sandbox";
}

function basicAuthHeader() {
  return `Basic ${Buffer.from(`${config.qboClientId}:${config.qboClientSecret}`).toString("base64")}`;
}

/**
 * Create CSRF state and return Intuit authorize URL for an admin user.
 */
export async function beginQuickBooksConnect(user) {
  assertAppConfigured();

  if (currentEnvironment() === "production") {
    throw new Error(
      "Production QuickBooks connect is disabled. Set QBO_ENVIRONMENT=sandbox for Phase 1."
    );
  }

  const state = crypto.randomBytes(32).toString("hex");
  await QuickBooksOAuthState.create({
    state,
    userId: String(user.id || user._id || ""),
    userEmail: String(user.email || ""),
    userName: String(user.name || ""),
    expiresAt: new Date(Date.now() + STATE_TTL_MS),
  });

  const params = new URLSearchParams({
    client_id: config.qboClientId,
    response_type: "code",
    scope: ACCOUNTING_SCOPE,
    redirect_uri: config.qboRedirectUri,
    state,
  });

  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Validate state, exchange code, persist connection. Never logs tokens.
 */
export async function completeQuickBooksCallback({ code, state, realmId }) {
  assertAppConfigured();

  if (!code || !state || !realmId) {
    throw new Error("Missing OAuth code, state, or realmId from Intuit callback");
  }

  const pending = await QuickBooksOAuthState.findOneAndDelete({ state }).lean();
  if (!pending) {
    throw new Error("Invalid or expired OAuth state");
  }
  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    throw new Error("OAuth state expired — start connect again");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: String(code),
    redirect_uri: config.qboRedirectUri,
  });

  let tokenResponse;
  try {
    tokenResponse = await axios.post(TOKEN_URL, body.toString(), {
      headers: {
        Authorization: basicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      timeout: 20_000,
    });
  } catch (error) {
    const status = error.response?.status;
    const errCode = error.response?.data?.error;
    const errDesc = error.response?.data?.error_description;
    console.warn(
      "[quickbooks] OAuth code exchange failed",
      status || error.message,
      errCode || "",
      errDesc ? String(errDesc).slice(0, 120) : ""
    );
    throw new Error("Failed to exchange QuickBooks authorization code");
  }

  const { access_token, refresh_token, expires_in } = tokenResponse.data || {};
  if (!access_token || !refresh_token) {
    throw new Error("QuickBooks token response incomplete");
  }

  const environment = currentEnvironment();
  const expiresAt = new Date(Date.now() + Number(expires_in || 3600) * 1000);

  await QuickBooksConnection.findOneAndUpdate(
    { environment },
    {
      $set: {
        environment,
        realmId: String(realmId),
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        connectedBy: {
          userId: pending.userId,
          name: pending.userName,
          email: pending.userEmail,
        },
        lastRefreshedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return {
    environment,
    realmId: String(realmId),
    connectedByEmail: pending.userEmail,
  };
}

export async function getStoredConnection() {
  return QuickBooksConnection.findOne({ environment: currentEnvironment() }).lean();
}

/** Public status — never includes tokens */
export async function getQuickBooksConnectionStatus() {
  const env = currentEnvironment();
  const doc = await getStoredConnection();
  const legacyEnvReady = Boolean(
    hasQuickBooksAppConfig && config.qboRefreshToken && config.qboRealmId
  );

  return {
    environment: env,
    appConfigured: hasQuickBooksAppConfig,
    redirectUriConfigured: Boolean(config.qboRedirectUri),
    connected: Boolean(doc?.realmId && doc?.refreshToken),
    realmId: doc?.realmId || null,
    connectedAt: doc?.connectedAt || null,
    connectedBy: doc?.connectedBy
      ? { name: doc.connectedBy.name || "", email: doc.connectedBy.email || "" }
      : null,
    accessTokenExpiresAt: doc?.accessTokenExpiresAt || null,
    legacyEnvTokensPresent: legacyEnvReady,
    productionConnectBlocked: env === "production",
  };
}
