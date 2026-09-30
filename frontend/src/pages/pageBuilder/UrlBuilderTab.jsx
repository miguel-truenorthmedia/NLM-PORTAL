import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchBigoAccounts,
  fetchFilterOptions,
  fetchMbConfig,
  saveMbConfig,
} from "../../services/api.js";

/** Sources supported by URL builder today — expand when new networks are wired. */
const TRAFFIC_SOURCES = [{ id: "bigo", label: "BIGO" }];

const ANGLE_OPTIONS = ["A01", "A03"];

/**
 * BIGO landing query template.
 * Only {mb}, {account}, and {angle} are filled by media buyers — macros stay as-is.
 */
const BIGO_URL_TEMPLATE =
  "bbg_clickid=__BBG__&ad_account_id=__ACCOUNT_ID__&campaign_name=__CAMPAIGN_NAME__&campaign_id=__CAMPAIGN_ID__&ad_group_name=__GROUP_NAME__&ad_group_id=__AD_GROUP_ID__&ad_name=__AD_NAME__&ad_id=__AD_ID__&publisher_id=__PUBLISHER_ID__&sub_publisher_id=__SUB_PUBLISHER_ID__&pixel_id=__PIXEL_ID__&channel=BBG&mb={mb}&account={account}&angle={angle}&key=X184GA";

function sanitizeParam(value) {
  return String(value || "").replace(/\s+/g, "");
}

/**
 * Media buyers may paste full URLs, www, paths, or forget ".com".
 * Normalize to a bare hostname like benefitcomparenow.com.
 */
function normalizeDomain(raw) {
  let value = String(raw || "").trim().toLowerCase();
  if (!value) return "";

  value = value.replace(/\s+/g, "");
  value = value.replace(/^https?:\/\//i, "");
  value = value.replace(/^www\./i, "");
  // Drop path / query / hash if they pasted a full URL
  value = value.split("/")[0].split("?")[0].split("#")[0];
  value = value.replace(/\.+$/g, "");

  if (!value) return "";
  // No TLD yet → assume .com
  if (!value.includes(".")) {
    value = `${value}.com`;
  }

  return value;
}

/** Path segment only — no spaces or slashes (e.g. fe, medi). */
function normalizeSubDomain(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "");
}

function buildBigoUrl({ domain, subDomain, mb, account, angle }) {
  const host = normalizeDomain(domain);
  const path = normalizeSubDomain(subDomain);
  if (!host || !path) return "";

  const query = BIGO_URL_TEMPLATE.replace("{mb}", sanitizeParam(mb))
    .replace("{account}", sanitizeParam(account))
    .replace("{angle}", sanitizeParam(angle));

  return `https://${host}/${path}/?${query}`;
}

function MbConfigurator() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMbConfig();
      setRows(
        (data.accounts || []).map((account) => ({
          id: account.id,
          displayName: account.displayName,
          mb: account.mb || "",
        }))
      );
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load mb config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await saveMbConfig(
        rows.map((row) => ({ id: row.id, mb: sanitizeParam(row.mb) }))
      );
      setRows(
        (data.accounts || []).map((account) => ({
          id: account.id,
          displayName: account.displayName,
          mb: account.mb || "",
        }))
      );
      setMessage("mb values saved.");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save mb config");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card url-builder-config">
      <div className="url-builder-result-header">
        <div>
          <h3>mb configurator</h3>
          <p className="subtle">CEO only — set the autofill value for mb= per ad account.</p>
        </div>
      </div>

      {loading ? <p className="subtle">Loading…</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {message ? <p className="subtle">{message}</p> : null}

      {!loading && rows.length > 0 ? (
        <form className="spend-form" onSubmit={handleSave}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ad account</th>
                  <th>mb value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{sanitizeParam(row.displayName) || row.displayName}</td>
                    <td>
                      <input
                        type="text"
                        value={row.mb}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, mb: e.target.value.replace(/\s+/g, "") }
                                : item
                            )
                          )
                        }
                        placeholder="e.g. fe"
                        required
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="submit" className="btn btn-inline" disabled={saving}>
            {saving ? "Saving…" : "Save mb values"}
          </button>
        </form>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <p className="subtle">No portal ad accounts configured yet.</p>
      ) : null}
    </div>
  );
}

export default function UrlBuilderTab() {
  const { isCeo } = useAuth();
  const [trafficSourceId, setTrafficSourceId] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [domain, setDomain] = useState("");
  const [subDomain, setSubDomain] = useState("");
  const [angle, setAngle] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [portalAccounts, setPortalAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    setAdAccountId("");
    setDomain("");
    setSubDomain("");
    setAngle("");
    setAccounts([]);
    setAccountsError("");
    setCopied(false);
    setCopyError("");

    if (!trafficSourceId) return;

    if (trafficSourceId !== "bigo") {
      setAccountsError("This traffic source is not supported yet.");
      return;
    }

    let cancelled = false;
    setAccountsLoading(true);

    Promise.all([fetchBigoAccounts(), fetchFilterOptions()])
      .then(([bigoData, filters]) => {
        if (cancelled) return;
        const list = Array.isArray(bigoData?.accounts) ? bigoData.accounts : [];
        setAccounts(
          [...list].sort((a, b) =>
            String(a.name || a.id).localeCompare(String(b.name || b.id), undefined, {
              sensitivity: "base",
            })
          )
        );
        setPortalAccounts(Array.isArray(filters?.adAccounts) ? filters.adAccounts : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setAccounts([]);
        setAccountsError(
          err.response?.data?.error || err.message || "Failed to load BIGO ad accounts"
        );
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trafficSourceId]);

  const selectedBigoAccount = useMemo(
    () => accounts.find((account) => String(account.id) === String(adAccountId)) || null,
    [accounts, adAccountId]
  );

  const linkedPortalAccount = useMemo(() => {
    if (!adAccountId) return null;
    return (
      portalAccounts.find(
        (account) =>
          String(account.bigoAccountId || "") === String(adAccountId) &&
          (account.trafficSourceId || "bigo") === "bigo"
      ) || null
    );
  }, [portalAccounts, adAccountId]);

  const mbValue = String(linkedPortalAccount?.mb || "").trim();
  const accountValue = String(
    linkedPortalAccount?.displayName || selectedBigoAccount?.name || ""
  ).trim();

  const normalizedDomain = normalizeDomain(domain);
  const normalizedSubDomain = normalizeSubDomain(subDomain);

  const generatedUrl = useMemo(() => {
    if (!mbValue || !accountValue || !angle || !normalizedDomain || !normalizedSubDomain) {
      return "";
    }
    return buildBigoUrl({
      domain: normalizedDomain,
      subDomain: normalizedSubDomain,
      mb: mbValue,
      account: accountValue,
      angle,
    });
  }, [mbValue, accountValue, angle, normalizedDomain, normalizedSubDomain]);

  const mbMissing = Boolean(adAccountId && !mbValue);

  async function handleCopy() {
    if (!generatedUrl) return;
    setCopyError("");
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Could not copy — select the URL and copy manually.");
    }
  }

  return (
    <div className="url-builder">
      <div className="card filter-panel">
        <div className="filter-grid url-builder-filters">
          <label>
            Traffic Source
            <select
              value={trafficSourceId}
              onChange={(e) => setTrafficSourceId(e.target.value)}
            >
              <option value="">Select traffic source…</option>
              {TRAFFIC_SOURCES.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>

          {trafficSourceId ? (
            <label>
              Ad Account
              <select
                value={adAccountId}
                onChange={(e) => {
                  setAdAccountId(e.target.value);
                  setDomain("");
                  setSubDomain("");
                  setAngle("");
                  setCopied(false);
                  setCopyError("");
                }}
                disabled={accountsLoading || Boolean(accountsError) || accounts.length === 0}
              >
                <option value="">
                  {accountsLoading
                    ? "Loading accounts…"
                    : accountsError
                      ? "Unavailable"
                      : accounts.length === 0
                        ? "No ad accounts found"
                        : "Select ad account…"}
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || account.id}
                    {account.currency ? ` (${account.currency})` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {adAccountId && !mbMissing ? (
            <>
              <label>
                Domain
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="benefitcomparenow.com"
                  autoComplete="off"
                />
                {domain && normalizedDomain ? (
                  <span className="subtle url-builder-field-hint">Uses: {normalizedDomain}</span>
                ) : null}
              </label>
              <label>
                Subdomain / path
                <input
                  type="text"
                  value={subDomain}
                  onChange={(e) => setSubDomain(e.target.value)}
                  placeholder="fe"
                  autoComplete="off"
                />
                {subDomain && normalizedSubDomain ? (
                  <span className="subtle url-builder-field-hint">
                    Uses: /{normalizedSubDomain}/
                  </span>
                ) : null}
              </label>
              <label>
                mb
                <input type="text" value={mbValue} readOnly />
              </label>
              <label>
                account
                <input type="text" value={sanitizeParam(accountValue)} readOnly />
              </label>
              <label>
                angle
                <select value={angle} onChange={(e) => setAngle(e.target.value)}>
                  <option value="">Select angle…</option>
                  {ANGLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>

        {accountsError ? <p className="error-text">{accountsError}</p> : null}
        {mbMissing ? (
          <p className="error-text">
            This BIGO account has no mb value configured. Ask CEO to set it in the mb configurator.
          </p>
        ) : null}
      </div>

      {generatedUrl ? (
        <div className="card url-builder-result">
          <div className="url-builder-result-header">
            <h3>Ready URL</h3>
            <button type="button" className="btn btn-inline" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea className="url-builder-output" value={generatedUrl} readOnly rows={5} />
          {copyError ? <p className="error-text">{copyError}</p> : null}
          <p className="subtle">
            Full landing URL with BIGO macros left as-is. Copy and paste into the ad.
          </p>
        </div>
      ) : null}

      {isCeo ? <MbConfigurator /> : null}
    </div>
  );
}
