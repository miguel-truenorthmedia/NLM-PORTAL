import axios from "axios";
import { config, hasQuickBooksAppConfig } from "../config.js";
import { QuickBooksConnection } from "../models/QuickBooksConnection.js";

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function currentEnvironment() {
  return config.qboEnvironment === "production" ? "production" : "sandbox";
}

function getApiBaseUrl() {
  return currentEnvironment() === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

function basicAuthHeader() {
  return `Basic ${Buffer.from(`${config.qboClientId}:${config.qboClientSecret}`).toString("base64")}`;
}

function sanitizeQboError(error) {
  const status = error.response?.status;
  const fault = error.response?.data?.Fault?.Error?.[0];
  const detail = fault?.Detail || fault?.Message || error.message || "QuickBooks request failed";
  // Never echo raw response bodies that might include sensitive fields
  return {
    status: status || 500,
    message: String(detail).slice(0, 300),
  };
}

/**
 * Resolve usable tokens: Mongo connection first, then legacy .env fallback.
 */
async function loadCredentialSource() {
  if (!hasQuickBooksAppConfig) {
    throw new Error(
      "QuickBooks app is not configured. Set QBO_CLIENT_ID and QBO_CLIENT_SECRET."
    );
  }

  const doc = await QuickBooksConnection.findOne({ environment: currentEnvironment() });
  if (doc?.refreshToken && doc?.realmId) {
    return { source: "mongo", doc };
  }

  if (config.qboRefreshToken && config.qboRealmId) {
    return {
      source: "env",
      realmId: config.qboRealmId,
      refreshToken: config.qboRefreshToken,
      accessToken: null,
      accessTokenExpiresAt: null,
    };
  }

  throw new Error(
    "QuickBooks is not connected. An admin must complete OAuth via /api/integrations/quickbooks/connect."
  );
}

async function refreshAccessToken(refreshToken, { persistDoc = null } = {}) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  let response;
  try {
    response = await axios.post(TOKEN_URL, body.toString(), {
      headers: {
        Authorization: basicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      timeout: 20_000,
    });
  } catch (error) {
    const sanitized = sanitizeQboError(error);
    console.warn("[quickbooks] token refresh failed", sanitized.status, sanitized.message);
    throw new Error("Failed to refresh QuickBooks access token");
  }

  const { access_token, refresh_token, expires_in } = response.data || {};
  if (!access_token) {
    throw new Error("QuickBooks token refresh did not return an access_token");
  }

  const expiresAt = new Date(Date.now() + Number(expires_in || 3600) * 1000);
  const nextRefresh = refresh_token || refreshToken;

  if (persistDoc) {
    persistDoc.accessToken = access_token;
    persistDoc.refreshToken = nextRefresh;
    persistDoc.accessTokenExpiresAt = expiresAt;
    persistDoc.lastRefreshedAt = new Date();
    await persistDoc.save();
  } else if (refresh_token && refresh_token !== refreshToken) {
    // Legacy env path — rotated token only lives until restart unless saved to Mongo
    console.warn(
      "[quickbooks] Refresh token rotated while using legacy .env credentials. Complete OAuth connect to persist tokens in the database."
    );
  }

  return { accessToken: access_token, refreshToken: nextRefresh, expiresAt };
}

/**
 * Returns a valid access token + realmId. Refreshes when expired/near expiry.
 */
export async function getQuickBooksAuthContext({ forceRefresh = false } = {}) {
  const source = await loadCredentialSource();

  if (source.source === "mongo") {
    const doc = source.doc;
    const expiresAt = doc.accessTokenExpiresAt
      ? new Date(doc.accessTokenExpiresAt).getTime()
      : 0;
    const stillValid = !forceRefresh && doc.accessToken && Date.now() < expiresAt - 60_000;

    if (stillValid) {
      return {
        accessToken: doc.accessToken,
        realmId: doc.realmId,
        environment: currentEnvironment(),
      };
    }

    const refreshed = await refreshAccessToken(doc.refreshToken, { persistDoc: doc });
    return {
      accessToken: refreshed.accessToken,
      realmId: doc.realmId,
      environment: currentEnvironment(),
    };
  }

  // Legacy env fallback
  const refreshed = await refreshAccessToken(source.refreshToken);
  return {
    accessToken: refreshed.accessToken,
    realmId: source.realmId,
    environment: currentEnvironment(),
  };
}

/** True when OAuth connection or legacy env tokens can call the API */
export async function isQuickBooksReady() {
  try {
    await loadCredentialSource();
    return true;
  } catch {
    return false;
  }
}

/** @deprecated use getQuickBooksAuthContext — kept for older call sites */
export async function getQuickBooksAccessToken(options = {}) {
  const ctx = await getQuickBooksAuthContext(options);
  return ctx.accessToken;
}

export function assertQuickBooksConfigured() {
  // Soft check — actual readiness validated in getQuickBooksAuthContext
  if (!hasQuickBooksAppConfig) {
    throw new Error(
      "QuickBooks is not configured. Set QBO_CLIENT_ID and QBO_CLIENT_SECRET, then complete OAuth."
    );
  }
}

export async function quickBooksQuery(selectStatement) {
  const { accessToken, realmId } = await getQuickBooksAuthContext();
  const url = `${getApiBaseUrl()}/v3/company/${realmId}/query`;

  try {
    const response = await axios.get(url, {
      params: {
        query: selectStatement,
        minorversion: 73,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      timeout: 30_000,
    });
    return response.data?.QueryResponse || {};
  } catch (error) {
    if (error.response?.status === 401) {
      const retry = await getQuickBooksAuthContext({ forceRefresh: true });
      const retryUrl = `${getApiBaseUrl()}/v3/company/${retry.realmId}/query`;
      const response = await axios.get(retryUrl, {
        params: {
          query: selectStatement,
          minorversion: 73,
        },
        headers: {
          Authorization: `Bearer ${retry.accessToken}`,
          Accept: "application/json",
        },
        timeout: 30_000,
      });
      return response.data?.QueryResponse || {};
    }
    const sanitized = sanitizeQboError(error);
    console.warn("[quickbooks] query failed", sanitized.status, sanitized.message);
    const err = new Error(sanitized.message);
    err.status = sanitized.status;
    throw err;
  }
}

/**
 * Authenticated GET against the QBO company API.
 * pathSuffix examples: `invoice/123`, `customer/45`
 */
export async function quickBooksGet(pathSuffix, { params = {} } = {}) {
  const suffix = String(pathSuffix || "").replace(/^\/+/, "");
  if (!suffix) {
    const err = new Error("QuickBooks resource path is required");
    err.status = 400;
    throw err;
  }

  const { accessToken, realmId } = await getQuickBooksAuthContext();
  const url = `${getApiBaseUrl()}/v3/company/${realmId}/${suffix}`;
  const requestParams = { minorversion: 73, ...params };

  try {
    const response = await axios.get(url, {
      params: requestParams,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      timeout: 30_000,
    });
    return response.data || {};
  } catch (error) {
    if (error.response?.status === 401) {
      const retry = await getQuickBooksAuthContext({ forceRefresh: true });
      const retryUrl = `${getApiBaseUrl()}/v3/company/${retry.realmId}/${suffix}`;
      try {
        const response = await axios.get(retryUrl, {
          params: requestParams,
          headers: {
            Authorization: `Bearer ${retry.accessToken}`,
            Accept: "application/json",
          },
          timeout: 30_000,
        });
        return response.data || {};
      } catch (retryError) {
        const sanitized = sanitizeQboError(retryError);
        console.warn("[quickbooks] get failed", sanitized.status, sanitized.message);
        const err = new Error(sanitized.message);
        err.status = sanitized.status;
        throw err;
      }
    }
    const sanitized = sanitizeQboError(error);
    console.warn("[quickbooks] get failed", sanitized.status, sanitized.message);
    const err = new Error(sanitized.message);
    err.status = sanitized.status;
    throw err;
  }
}

/** Paginate a QBO query (MAXRESULTS 1000). */
export async function quickBooksQueryAll(selectWithoutPaging, { pageSize = 1000 } = {}) {
  const size = Math.min(Math.max(Number(pageSize) || 1000, 1), 1000);
  let start = 1;
  const all = [];

  for (;;) {
    const statement = `${selectWithoutPaging} STARTPOSITION ${start} MAXRESULTS ${size}`;
    const result = await quickBooksQuery(statement);
    const entityKey = Object.keys(result).find(
      (key) => !["startPosition", "maxResults", "totalCount"].includes(key)
    );
    const batch = entityKey ? result[entityKey] || [] : [];
    const rows = Array.isArray(batch) ? batch : [batch];
    all.push(...rows);

    if (rows.length < size) break;
    start += size;
  }

  return all;
}

export { getApiBaseUrl, sanitizeQboError };
