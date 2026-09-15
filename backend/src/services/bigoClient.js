import { config, hasMongoConfig } from "../config.js";
import { BigoCredential } from "../models/BigoCredential.js";

const BASE = "https://api.adsbigo.com";

function requireBigoEnv() {
  if (!config.bigoAdsClientId || !config.bigoAdsClientSecret) {
    throw new Error("BIGO Ads is not configured. Set BIGO_CLIENT_ID and BIGO_CLIENT_SECRET.");
  }
}

async function loadStoredCredentials() {
  if (!hasMongoConfig) {
    return {
      accessToken: config.bigoAdsAccessToken || "",
      refreshToken: config.bigoAdsRefreshToken || "",
      accessTokenExpiresAt: null,
    };
  }

  let doc = await BigoCredential.findOne({ key: "default" });
  if (!doc) {
    doc = await BigoCredential.create({
      key: "default",
      accessToken: config.bigoAdsAccessToken || "",
      refreshToken: config.bigoAdsRefreshToken || "",
      accessTokenExpiresAt: null,
    });
  } else if (!doc.accessToken && config.bigoAdsAccessToken) {
    doc.accessToken = config.bigoAdsAccessToken;
    doc.refreshToken = config.bigoAdsRefreshToken || doc.refreshToken;
    await doc.save();
  }

  return {
    accessToken: doc.accessToken || config.bigoAdsAccessToken || "",
    refreshToken: doc.refreshToken || config.bigoAdsRefreshToken || "",
    accessTokenExpiresAt: doc.accessTokenExpiresAt || null,
  };
}

async function saveCredentials({ accessToken, refreshToken, expiresIn }) {
  if (!hasMongoConfig) return;
  const accessTokenExpiresAt =
    expiresIn != null ? new Date(Date.now() + Number(expiresIn) * 1000) : null;
  await BigoCredential.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        accessToken: accessToken || "",
        refreshToken: refreshToken || "",
        accessTokenExpiresAt,
      },
    },
    { upsert: true }
  );
}

async function refreshTokens(refreshToken) {
  requireBigoEnv();
  if (!refreshToken) throw new Error("Missing BIGO refresh token");

  const basic = Buffer.from(`${config.bigoAdsClientId}:${config.bigoAdsClientSecret}`).toString(
    "base64"
  );
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!json.access_token) {
    throw new Error(`BIGO token refresh failed: ${JSON.stringify(json)}`);
  }

  await saveCredentials({
    accessToken: json.access_token,
    refreshToken: json.refresh_token || refreshToken,
    expiresIn: json.expires_in,
  });

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || refreshToken,
  };
}

async function getValidAccessToken() {
  requireBigoEnv();
  let creds = await loadStoredCredentials();
  if (!creds.accessToken && creds.refreshToken) {
    creds = await refreshTokens(creds.refreshToken);
  }
  if (!creds.accessToken) {
    throw new Error("Missing BIGO access token. Set BIGO_ACCESS_TOKEN / BIGO_REFRESH_TOKEN.");
  }

  const expiresSoon =
    creds.accessTokenExpiresAt &&
    creds.accessTokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (expiresSoon && creds.refreshToken) {
    creds = await refreshTokens(creds.refreshToken);
  }

  return creds.accessToken;
}

/**
 * POST JSON to BIGO OpenAPI. Retries once after token refresh on auth failure.
 */
export async function bigoPost(path, body = {}, { advertiserId } = {}) {
  const run = async (token) => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (advertiserId != null && advertiserId !== "") {
      headers["advertiser-id"] = String(advertiserId);
    }
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    // BIGO IDs exceed JS safe integer range — keep them as strings.
    const safeText = text.replace(
      /"(adsetId|campaignId|adId|advertiserId|id)"\s*:\s*(\d{15,})/g,
      '"$1":"$2"'
    );
    let json = {};
    try {
      json = JSON.parse(safeText);
    } catch {
      json = {};
    }
    return { status: res.status, json };
  };

  let token = await getValidAccessToken();
  let result = await run(token);

  const authFailed =
    result.status === 401 ||
    result.json?.retcode === 401 ||
    /token|unauth|expire/i.test(String(result.json?.retmsg || ""));

  if (authFailed) {
    const creds = await loadStoredCredentials();
    const refreshed = await refreshTokens(creds.refreshToken);
    result = await run(refreshed.accessToken);
  }

  if (result.json?.retcode != null && result.json.retcode !== 0) {
    throw new Error(result.json.retmsg || `BIGO API error (retcode ${result.json.retcode})`);
  }

  return result.json;
}

export async function bigoListAll(path, baseBody = {}, { advertiserId } = {}) {
  const pageSize = 100;
  let pageNo = 1;
  const all = [];
  let total = null;

  while (pageNo <= 50) {
    const json = await bigoPost(path, { ...baseBody, pageNo, pageSize }, { advertiserId });
    const list = json?.result?.list || [];
    total = json?.result?.total ?? total;
    all.push(...list);
    if (!list.length || all.length >= (total ?? all.length) || list.length < pageSize) break;
    pageNo += 1;
  }

  return { total: total ?? all.length, list: all };
}

export function hasBigoAdsConfig() {
  return Boolean(config.bigoAdsClientId && config.bigoAdsClientSecret);
}
