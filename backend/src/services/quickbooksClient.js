import axios from "axios";
import { config, hasQuickBooksConfig } from "../config.js";

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/token";

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
/** In-memory refresh token — Intuit may rotate it on refresh. */
let runtimeRefreshToken = config.qboRefreshToken;

function getApiBaseUrl() {
  return config.qboEnvironment === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

export function assertQuickBooksConfigured() {
  if (!hasQuickBooksConfig) {
    throw new Error(
      "QuickBooks is not configured. Set QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REFRESH_TOKEN, and QBO_REALM_ID."
    );
  }
}

/**
 * Exchange refresh token for a short-lived access token.
 * If Intuit returns a new refresh token, keep it in memory and log a reminder to update .env.
 */
export async function getQuickBooksAccessToken({ forceRefresh = false } = {}) {
  assertQuickBooksConfigured();

  const now = Date.now();
  if (!forceRefresh && cachedAccessToken && now < cachedAccessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const basicAuth = Buffer.from(`${config.qboClientId}:${config.qboClientSecret}`).toString(
    "base64"
  );

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: runtimeRefreshToken || config.qboRefreshToken,
  });

  const response = await axios.post(TOKEN_URL, body.toString(), {
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
  });

  const { access_token, expires_in, refresh_token } = response.data || {};
  if (!access_token) {
    throw new Error("QuickBooks token refresh did not return an access_token");
  }

  if (refresh_token && refresh_token !== runtimeRefreshToken) {
    runtimeRefreshToken = refresh_token;
    console.warn(
      "[quickbooks] Intuit rotated the refresh token. Update QBO_REFRESH_TOKEN in backend/.env with the new value (check logs / token response) before the next restart."
    );
  }

  cachedAccessToken = access_token;
  cachedAccessTokenExpiresAt = now + Number(expires_in || 3600) * 1000;
  return cachedAccessToken;
}

export async function quickBooksQuery(selectStatement) {
  assertQuickBooksConfigured();
  const accessToken = await getQuickBooksAccessToken();
  const url = `${getApiBaseUrl()}/v3/company/${config.qboRealmId}/query`;

  const response = await axios.get(url, {
    params: {
      query: selectStatement,
      minorversion: 73,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  return response.data?.QueryResponse || {};
}

/** Paginate a QBO query (MAXRESULTS 1000). */
export async function quickBooksQueryAll(selectWithoutPaging, { pageSize = 1000 } = {}) {
  const size = Math.min(Math.max(Number(pageSize) || 1000, 1), 1000);
  let start = 1;
  const all = [];

  for (;;) {
    const statement = `${selectWithoutPaging} STARTPOSITION ${start} MAXRESULTS ${size}`;
    const result = await quickBooksQuery(statement);
    // Entity name is first key besides startPosition/maxResults/totalCount
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
