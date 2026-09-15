import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchBigoAccounts,
  fetchBigoCampaigns,
  fetchBigoControllerLive,
  fetchBigoTracked,
  saveBigoTracked,
  setBigoAdsetPaused,
  setBigoCampaignPaused,
  updateBigoAdsetBidBudget,
} from "../../services/api.js";

function money(value, currency = "USD") {
  const n = Number(value) || 0;
  try {
    return n.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCpc(cpc, currency = "USD") {
  if (cpc == null || !Number.isFinite(Number(cpc))) return "—";
  return money(cpc, currency);
}

function campaignKey(advertiserId, campaignId) {
  return `${advertiserId}::${campaignId}`;
}

function calcCpc(cost, incomingCalls) {
  const calls = Number(incomingCalls) || 0;
  const spend = Number(cost) || 0;
  if (calls <= 0) return null;
  return spend / calls;
}

function formatIncoming(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Number.isInteger(n) ? n : Math.round(n);
}

function calcProfit(revenue, cost) {
  return (Number(revenue) || 0) - (Number(cost) || 0);
}

function calcRoi(profit, cost) {
  const spend = Number(cost) || 0;
  if (spend <= 0) return null;
  return ((Number(profit) || 0) / spend) * 100;
}

/** ROI tier for profit/ROI coloring */
function pnlTone(roi) {
  if (roi == null || !Number.isFinite(Number(roi))) return "";
  const n = Number(roi);
  if (n > 20) return "bigo-pnl--strong-pos";
  if (n > 0) return "bigo-pnl--pos";
  if (n >= -20) return "bigo-pnl--neg";
  return "bigo-pnl--strong-neg";
}

function formatRoi(roi) {
  if (roi == null || !Number.isFinite(Number(roi))) return "—";
  const n = Number(roi);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

/** Only show when metric rose vs the current 30-min movement baseline. */
function MetricUpTrend({ deltaPct }) {
  const pct = Number(deltaPct);
  if (!Number.isFinite(pct) || pct <= 0) return null;
  const label = pct >= 10 ? pct.toFixed(0) : pct.toFixed(1);
  return (
    <span className="bigo-metric-up" title={`Up ${label}% vs half-hour baseline`}>
      <span className="bigo-metric-up-arrow" aria-hidden="true">
        ↑
      </span>
      <span className="bigo-metric-up-pct">{label}%</span>
    </span>
  );
}

let toastSeq = 0;

function ToastStack({ toasts, onDismiss }) {
  if (!toasts?.length) return null;
  return (
    <div className="bigo-toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`bigo-toast bigo-toast--${t.type || "success"}`}
          role="status"
        >
          <span className="bigo-toast-text">{t.text}</span>
          <button
            type="button"
            className="bigo-toast-dismiss"
            aria-label="Dismiss"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function PauseIconButton({
  paused,
  busy,
  onClick,
  pausedTitle,
  liveTitle,
  pausedLabel,
  liveLabel,
  inline = false,
  showLiveLabel = false,
}) {
  const button = (
    <button
      type="button"
      className={[
        "bigo-pause-icon",
        paused ? "bigo-pause-icon--paused" : "bigo-pause-icon--live",
        inline ? "bigo-pause-icon--inline" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={paused ? pausedTitle : liveTitle}
      aria-label={paused ? pausedLabel : liveLabel}
      disabled={busy}
      onClick={onClick}
    >
      {paused ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      )}
    </button>
  );

  if (!showLiveLabel) return button;

  return (
    <div
      className={
        inline ? "bigo-status-control bigo-status-control--inline" : "bigo-status-control"
      }
    >
      {!paused ? <span className="bigo-live-label">Live</span> : null}
      {button}
    </div>
  );
}

function MetricsCard({
  title,
  cost,
  conversions,
  revenue,
  incomingCalls,
  cpc,
  profit,
  roi,
  basicGoalBid,
  budget,
  costDeltaPct,
  cpcDeltaPct,
  currency,
  paused = false,
  pauseProps,
  onSaveBidBudget,
  savingBidBudget = false,
}) {
  const profitVal = profit != null ? profit : calcProfit(revenue, cost);
  const roiVal = roi != null ? roi : calcRoi(profitVal, cost);
  const tone = pnlTone(roiVal);

  const [bidInput, setBidInput] = useState(() =>
    basicGoalBid != null && Number.isFinite(Number(basicGoalBid)) ? String(basicGoalBid) : ""
  );
  const [budgetInput, setBudgetInput] = useState(() =>
    budget != null && Number.isFinite(Number(budget)) ? String(budget) : ""
  );

  useEffect(() => {
    setBidInput(
      basicGoalBid != null && Number.isFinite(Number(basicGoalBid)) ? String(basicGoalBid) : ""
    );
  }, [basicGoalBid]);

  useEffect(() => {
    setBudgetInput(budget != null && Number.isFinite(Number(budget)) ? String(budget) : "");
  }, [budget]);

  const bidNum = Number(bidInput);
  const budgetNum = Number(budgetInput);
  const bidValid = Number.isFinite(bidNum) && bidNum > 0;
  const budgetValid = Number.isFinite(budgetNum) && budgetNum > 0;
  const bidChanged =
    bidValid &&
    (basicGoalBid == null || !Number.isFinite(Number(basicGoalBid)) || bidNum !== Number(basicGoalBid));
  const budgetChanged =
    budgetValid && (budget == null || !Number.isFinite(Number(budget)) || budgetNum !== Number(budget));
  const canSave =
    Boolean(onSaveBidBudget) &&
    bidValid &&
    budgetValid &&
    (bidChanged || budgetChanged) &&
    !savingBidBudget;

  return (
    <div className={paused ? "bigo-adset-card bigo-adset-card--paused" : "bigo-adset-card"}>
      {pauseProps ? <PauseIconButton showLiveLabel {...pauseProps} /> : null}
      <div className="bigo-adset-card-title">{title}</div>
      <div className="bigo-adset-metrics">
        <div className="bigo-metric">
          <span className="bigo-metric-label">Revenue</span>
          <span className="bigo-metric-value">{money(revenue, currency)}</span>
        </div>
        <div className="bigo-metric">
          <span className="bigo-metric-label">Cost</span>
          <span className="bigo-metric-value">
            {money(cost, currency)}
            <MetricUpTrend deltaPct={costDeltaPct} />
          </span>
        </div>
        <div className="bigo-metric">
          <span className="bigo-metric-label">Profit</span>
          <span className={`bigo-metric-value ${tone}`.trim()}>{money(profitVal, currency)}</span>
        </div>
        <div className="bigo-metric">
          <span className="bigo-metric-label">ROI</span>
          <span className={`bigo-metric-value ${tone}`.trim()}>{formatRoi(roiVal)}</span>
        </div>
        <div className="bigo-metric">
          <span className="bigo-metric-label">Incoming</span>
          <span className="bigo-metric-value">{formatIncoming(incomingCalls)}</span>
        </div>
        <div className="bigo-metric">
          <span className="bigo-metric-label">Conversion</span>
          <span className="bigo-metric-value">{conversions ?? 0}</span>
        </div>
        <div className="bigo-metric">
          <span className="bigo-metric-label">CPC</span>
          <span className="bigo-metric-value">
            {formatCpc(cpc, currency)}
            <MetricUpTrend deltaPct={cpcDeltaPct} />
          </span>
        </div>
      </div>

      <div className="bigo-adset-edit">
        <label className="bigo-adset-edit-field">
          <span className="bigo-metric-label">Goal bid</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            className="bigo-adset-edit-input"
            value={bidInput}
            disabled={savingBidBudget || !onSaveBidBudget}
            onChange={(e) => setBidInput(e.target.value)}
            aria-label="Goal bid"
          />
        </label>
        <label className="bigo-adset-edit-field">
          <span className="bigo-metric-label">Budget</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            className="bigo-adset-edit-input"
            value={budgetInput}
            disabled={savingBidBudget || !onSaveBidBudget}
            onChange={(e) => setBudgetInput(e.target.value)}
            aria-label="Budget"
          />
        </label>
        <button
          type="button"
          className="bigo-adset-update-btn"
          disabled={!canSave}
          onClick={() =>
            onSaveBidBudget?.({
              basicGoalBid: bidNum,
              budget: budgetNum,
            })
          }
        >
          {savingBidBudget ? "Updating…" : "Update"}
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone = "", deltaPct = null }) {
  return (
    <div className="bigo-summary-stat">
      <span className="bigo-summary-stat-label">{label}</span>
      <span className={`bigo-summary-stat-value ${tone}`.trim()}>
        {value}
        <MetricUpTrend deltaPct={deltaPct} />
      </span>
    </div>
  );
}

export default function CampaignControllerTab() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState(() => new Set());
  /** Map advertiserId -> campaigns[] */
  const [campaignsByAccount, setCampaignsByAccount] = useState({});
  const [tracked, setTracked] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [live, setLive] = useState({ accounts: [], campaigns: [], adsets: [], fetchedAt: null });
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [busyAdsetId, setBusyAdsetId] = useState("");
  const [busyBidBudgetAdsetId, setBusyBidBudgetAdsetId] = useState("");
  const [busyCampaignId, setBusyCampaignId] = useState("");
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef(new Map());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const [hiddenCampaignKeys, setHiddenCampaignKeys] = useState(() => {
    try {
      const raw = localStorage.getItem("bigo-controller-hidden-campaigns");
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list.map(String) : []);
    } catch {
      return new Set();
    }
  });

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (text, type = "success") => {
      const id = `toast-${++toastSeq}`;
      setToasts((prev) => [...prev.slice(-4), { id, text, type }]);
      const timer = setTimeout(() => dismissToast(id), 3800);
      toastTimersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      for (const timer of toastTimersRef.current.values()) clearTimeout(timer);
      toastTimersRef.current.clear();
    };
  }, []);

  const accountById = useMemo(() => {
    const map = new Map();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const loadLive = useCallback(async ({ refresh = false, quiet = false } = {}) => {
    if (!quiet) setLoadingLive(true);
    try {
      const data = await fetchBigoControllerLive({ refresh });
      setLive(data);
      if (data?.error) setError(data.error);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load live ad set data");
    } finally {
      if (!quiet) setLoadingLive(false);
    }
  }, []);

  const liveFetchedAtRef = useRef(null);
  useEffect(() => {
    liveFetchedAtRef.current = live.fetchedAt || null;
  }, [live.fetchedAt]);

  const bootstrap = useCallback(async () => {
    setLoadingMeta(true);
    setError("");
    try {
      const [accountsRes, trackedRes] = await Promise.all([fetchBigoAccounts(), fetchBigoTracked()]);
      const accountList = accountsRes.accounts || [];
      setAccounts(accountList);
      setTracked(trackedRes.campaigns || []);

      const keys = new Set(
        (trackedRes.campaigns || []).map((c) => campaignKey(c.advertiserId, c.campaignId))
      );
      setSelectedKeys(keys);

      const trackedAccountIds = new Set((trackedRes.campaigns || []).map((c) => c.advertiserId));
      if (trackedAccountIds.size) {
        setSelectedAccountIds(trackedAccountIds);
      } else {
        const preferred =
          accountList.find((a) => /franz.*fe/i.test(a.name || "")) || accountList[0] || null;
        setSelectedAccountIds(preferred ? new Set([preferred.id]) : new Set());
      }

      await loadLive({ quiet: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load BIGO accounts");
    } finally {
      setLoadingMeta(false);
    }
  }, [loadLive]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const id = setInterval(() => {
      // Keep the open tab on live data at least every 5 minutes.
      // If backend cron just wrote a fresh snapshot (<90s), only re-read it.
      // Otherwise force a BIGO/Ringba pull so we never sit on stale numbers.
      const fetchedAt = liveFetchedAtRef.current;
      const ageMs = fetchedAt ? Date.now() - new Date(fetchedAt).getTime() : Number.POSITIVE_INFINITY;
      const snapshotIsFresh = Number.isFinite(ageMs) && ageMs < 90_000;
      loadLive({ refresh: !snapshotIsFresh, quiet: true });
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadLive]);

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const onPointerDown = (event) => {
      if (!settingsRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  // Load campaigns for all selected accounts
  useEffect(() => {
    const ids = [...selectedAccountIds];
    if (!ids.length) {
      setCampaignsByAccount({});
      return;
    }

    let cancelled = false;
    setLoadingCampaigns(true);

    Promise.all(
      ids.map(async (id) => {
        try {
          const data = await fetchBigoCampaigns(id);
          return [id, data.campaigns || []];
        } catch {
          return [id, []];
        }
      })
    )
      .then((entries) => {
        if (cancelled) return;
        const next = {};
        for (const [id, list] of entries) next[id] = list;
        setCampaignsByAccount(next);
      })
      .finally(() => {
        if (!cancelled) setLoadingCampaigns(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAccountIds]);

  const toggleAccount = (accountId) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
        // Drop campaign selections for this account
        setSelectedKeys((keys) => {
          const pruned = new Set();
          for (const key of keys) {
            if (!key.startsWith(`${accountId}::`)) pruned.add(key);
          }
          return pruned;
        });
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const toggleCampaign = (advertiserId, campaign) => {
    const key = campaignKey(advertiserId, campaign.id);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const persistTracked = async (keysSet, { closeSettings = false } = {}) => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = [];
      const accountIds = new Set([...keysSet].map((key) => key.split("::")[0]));
      for (const advertiserId of accountIds) {
        const account = accountById.get(advertiserId);
        const list = campaignsByAccount[advertiserId] || [];
        // Prefer loaded campaign list; fall back to already-tracked rows
        const known = list.length
          ? list
          : tracked
              .filter((t) => t.advertiserId === advertiserId)
              .map((t) => ({ id: t.campaignId, name: t.campaignName }));

        for (const c of known) {
          if (!keysSet.has(campaignKey(advertiserId, c.id))) continue;
          payload.push({
            advertiserId,
            advertiserName: account?.name || tracked.find((t) => t.advertiserId === advertiserId)?.advertiserName || "",
            timezone: account?.timezone ?? tracked.find((t) => t.advertiserId === advertiserId)?.timezone ?? -5,
            currency: account?.currency || tracked.find((t) => t.advertiserId === advertiserId)?.currency || "USD",
            campaignId: c.id,
            campaignName: c.name,
          });
        }
      }

      const saved = await saveBigoTracked(payload);
      setTracked(saved.campaigns || []);
      const nextKeys = new Set(
        (saved.campaigns || []).map((c) => campaignKey(c.advertiserId, c.campaignId))
      );
      setSelectedKeys(nextKeys);
      setSelectedAccountIds(new Set((saved.campaigns || []).map((c) => c.advertiserId)));
      setMessage(`Tracking ${saved.campaigns?.length || 0} campaign(s)`);
      if (closeSettings) setSettingsOpen(false);
      await loadLive({ quiet: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save tracked campaigns");
    } finally {
      setSaving(false);
    }
  };

  const saveSelection = async () => {
    await persistTracked(selectedKeys, { closeSettings: true });
  };

  const removeTracked = async (row) => {
    const next = new Set(
      tracked
        .filter((t) => !(t.advertiserId === row.advertiserId && t.campaignId === row.campaignId))
        .map((t) => campaignKey(t.advertiserId, t.campaignId))
    );
    await persistTracked(next);
  };

  const openSettings = () => {
    setSettingsOpen((open) => {
      if (!open && tracked.length) {
        const keys = new Set(tracked.map((c) => campaignKey(c.advertiserId, c.campaignId)));
        setSelectedKeys(keys);
        setSelectedAccountIds(new Set(tracked.map((c) => c.advertiserId)));
      }
      return !open;
    });
  };

  const toggleCampaignHidden = (key) => {
    setHiddenCampaignKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(
          "bigo-controller-hidden-campaigns",
          JSON.stringify([...next])
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Prefer backend rollups; fall back to aggregating adsets from older snapshots
  const accountTotals = useMemo(() => {
    if (live.accounts?.length) return live.accounts;

    const map = new Map();
    for (const row of live.adsets || []) {
      if (!map.has(row.advertiserId)) {
        map.set(row.advertiserId, {
          advertiserId: row.advertiserId,
          advertiserName: row.advertiserName,
          currency: row.currency || "USD",
          cost: 0,
          conversions: 0,
          incomingCalls: 0,
          revenue: 0,
        });
      }
      const acc = map.get(row.advertiserId);
      acc.cost += Number(row.cost) || 0;
      acc.conversions += Number(row.conversions) || 0;
      acc.incomingCalls += Number(row.incomingCalls) || 0;
      acc.revenue += Number(row.revenue) || 0;
    }
    return [...map.values()].map((acc) => ({
      ...acc,
      cpc: calcCpc(acc.cost, acc.incomingCalls),
    }));
  }, [live.accounts, live.adsets]);

  const campaignCards = useMemo(() => {
    const hasMetrics = (live.campaigns || []).some(
      (c) => c.cost != null || c.conversions != null || c.cpc != null || c.paused != null
    );
    if (hasMetrics && live.campaigns?.length) {
      return live.campaigns.map((c) => {
        const cost = c.cost || 0;
        const revenue = c.revenue || 0;
        const profit = c.profit != null ? c.profit : calcProfit(revenue, cost);
        const roi = c.roi != null ? c.roi : calcRoi(profit, cost);
        return {
          key: campaignKey(c.advertiserId, c.campaignId),
          advertiserId: c.advertiserId,
          advertiserName: c.advertiserName,
          campaignId: c.campaignId,
          name: c.name || c.campaignName || c.campaignId,
          currency: c.currency || "USD",
          cost,
          conversions: c.conversions || 0,
          incomingCalls: c.incomingCalls || 0,
          revenue,
          profit,
          roi,
          cpc: c.cpc,
          costDeltaPct: c.costDeltaPct ?? null,
          cpcDeltaPct: c.cpcDeltaPct ?? null,
          paused: Boolean(c.paused),
        };
      });
    }

    const map = new Map();
    for (const row of live.adsets || []) {
      const key = campaignKey(row.advertiserId, row.campaignId);
      if (!map.has(key)) {
        map.set(key, {
          key,
          advertiserId: row.advertiserId,
          advertiserName: row.advertiserName,
          campaignId: row.campaignId,
          name: row.campaignName || row.campaignId,
          currency: row.currency || "USD",
          cost: 0,
          conversions: 0,
          incomingCalls: 0,
          revenue: 0,
          adsetCount: 0,
          pausedAdsets: 0,
        });
      }
      const c = map.get(key);
      c.cost += Number(row.cost) || 0;
      c.conversions += Number(row.conversions) || 0;
      c.incomingCalls += Number(row.incomingCalls) || 0;
      c.revenue += Number(row.revenue) || 0;
      c.adsetCount += 1;
      if (row.paused) c.pausedAdsets += 1;
    }
    return [...map.values()].map((c) => {
      const profit = calcProfit(c.revenue, c.cost);
      return {
        ...c,
        profit,
        roi: calcRoi(profit, c.cost),
        cpc: calcCpc(c.cost, c.incomingCalls),
        paused: Boolean(c.adsetCount && c.pausedAdsets === c.adsetCount),
      };
    });
  }, [live.campaigns, live.adsets]);

  const adsetsByCampaign = useMemo(() => {
    const groups = [];
    const map = new Map();
    for (const row of live.adsets || []) {
      const key = campaignKey(row.advertiserId, row.campaignId);
      if (!map.has(key)) {
        const entry = {
          key,
          advertiserId: row.advertiserId,
          advertiserName: row.advertiserName,
          campaignId: row.campaignId,
          campaignName: row.campaignName,
          adsets: [],
        };
        map.set(key, entry);
        groups.push(entry);
      }
      map.get(key).adsets.push(row);
    }
    return groups;
  }, [live.adsets]);

  /** Nested funnel: account → campaigns → ad groups */
  const funnelByAccount = useMemo(() => {
    const map = new Map();

    for (const acc of accountTotals) {
      map.set(acc.advertiserId, {
        account: acc,
        campaigns: [],
      });
    }

    for (const camp of campaignCards) {
      if (!map.has(camp.advertiserId)) {
        map.set(camp.advertiserId, {
          account: {
            advertiserId: camp.advertiserId,
            advertiserName: camp.advertiserName,
            currency: camp.currency,
            cost: 0,
            conversions: 0,
            cpc: null,
          },
          campaigns: [],
        });
      }
      const adsetGroup = adsetsByCampaign.find((g) => g.key === camp.key);
      map.get(camp.advertiserId).campaigns.push({
        ...camp,
        adsets: adsetGroup?.adsets || [],
      });
    }

    // Campaigns with adsets but missing from campaignCards
    for (const group of adsetsByCampaign) {
      const entry = map.get(group.advertiserId);
      if (!entry) continue;
      if (entry.campaigns.some((c) => c.key === group.key)) continue;
      entry.campaigns.push({
        key: group.key,
        advertiserId: group.advertiserId,
        advertiserName: group.advertiserName,
        campaignId: group.campaignId,
        name: group.campaignName,
        currency: "USD",
        cost: 0,
        conversions: 0,
        cpc: null,
        paused: false,
        adsets: group.adsets,
      });
    }

    return [...map.values()].map((entry) => ({
      ...entry,
      campaigns: [...entry.campaigns]
        .filter((c) => !hiddenCampaignKeys.has(c.key))
        .sort((a, b) => Number(Boolean(a.paused)) - Number(Boolean(b.paused))),
    }));
  }, [accountTotals, campaignCards, adsetsByCampaign, hiddenCampaignKeys]);

  const toggleAdsetPause = async (row) => {
    const nextPaused = !row.paused;
    setBusyAdsetId(row.id);
    setError("");
    try {
      await setBigoAdsetPaused({
        advertiserId: row.advertiserId,
        adsetId: row.id,
        paused: nextPaused,
      });
      pushToast(
        nextPaused ? `Paused ${row.name}` : `Unpaused ${row.name} — now live`,
        "success"
      );
      await loadLive({ quiet: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to update ad set status";
      setError(msg);
      pushToast(msg, "error");
    } finally {
      setBusyAdsetId("");
    }
  };

  const saveAdsetBidBudget = async (row, { basicGoalBid, budget }) => {
    setBusyBidBudgetAdsetId(row.id);
    setError("");
    setMessage("");
    try {
      await updateBigoAdsetBidBudget({
        advertiserId: row.advertiserId,
        adsetId: row.id,
        basicGoalBid,
        budget,
        budgetMode: row.budgetMode,
      });
      pushToast(
        `Updated ${row.name}: bid $${Number(basicGoalBid).toFixed(2)} · budget $${Number(budget).toFixed(2)}`,
        "success"
      );
      await loadLive({ quiet: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to update bid/budget";
      setError(msg);
      pushToast(msg, "error");
    } finally {
      setBusyBidBudgetAdsetId("");
    }
  };

  const toggleCampaignPause = async (row) => {
    const nextPaused = !row.paused;
    setBusyCampaignId(row.campaignId);
    setError("");
    try {
      await setBigoCampaignPaused({
        advertiserId: row.advertiserId,
        campaignId: row.campaignId,
        paused: nextPaused,
      });
      pushToast(
        nextPaused
          ? `Paused campaign ${row.campaignName || row.campaignId}`
          : `Unpaused campaign ${row.campaignName || row.campaignId} — now live`,
        "success"
      );
      await loadLive({ quiet: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to update campaign status";
      setError(msg);
      pushToast(msg, "error");
    } finally {
      setBusyCampaignId("");
    }
  };

  const selectedCampaignCount = selectedKeys.size;
  const hasLiveData = Boolean(live.adsets?.length || campaignCards.length || accountTotals.length);

  const hiddenTracked = useMemo(
    () =>
      tracked.filter((t) =>
        hiddenCampaignKeys.has(campaignKey(t.advertiserId, t.campaignId))
      ),
    [tracked, hiddenCampaignKeys]
  );

  return (
    <div className="bigo-controller">
      <div className="bigo-controller-header">
        <div className="bigo-controller-header-main">
          <h3>Campaign controller</h3>
          <p className="subtle">
            Account → Campaign → Ad groups · Auto every 5 min · Updated {formatWhen(live.fetchedAt)}
          </p>
        </div>
        <div className="bigo-controller-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            disabled={loadingLive}
            onClick={() => loadLive({ refresh: true })}
          >
            {loadingLive ? "Refreshing…" : "Refresh"}
          </button>
          <div className="bigo-settings" ref={settingsRef}>
            <button
              type="button"
              className={settingsOpen ? "bigo-gear-btn bigo-gear-btn--open" : "bigo-gear-btn"}
              aria-label="Tracking settings"
              aria-expanded={settingsOpen}
              title="Choose accounts & campaigns to track"
              onClick={openSettings}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.5.39 1.04.71 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.25.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
                />
              </svg>
            </button>

            {settingsOpen ? (
              <div className="bigo-settings-panel" role="dialog" aria-label="Tracking settings">
                <div className="bigo-settings-section">
                  <div className="bigo-panel-header">
                    <h4>Accounts</h4>
                    <span className="subtle">{selectedAccountIds.size} selected</span>
                  </div>
                  <ul className="bigo-chip-list">
                    {accounts.map((a) => {
                      const checked = selectedAccountIds.has(a.id);
                      return (
                        <li key={a.id}>
                          <label className={checked ? "bigo-chip bigo-chip--on" : "bigo-chip"}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAccount(a.id)}
                            />
                            <span>{a.name}</span>
                          </label>
                        </li>
                      );
                    })}
                    {!accounts.length ? <li className="subtle">No BIGO accounts available.</li> : null}
                  </ul>
                </div>

                <div className="bigo-settings-section">
                  <div className="bigo-panel-header">
                    <h4>Campaigns</h4>
                    <span className="subtle">{selectedCampaignCount} selected</span>
                  </div>
                  {!selectedAccountIds.size ? (
                    <p className="subtle">Select at least one account.</p>
                  ) : loadingCampaigns ? (
                    <p className="subtle">Loading campaigns…</p>
                  ) : (
                    <div className="bigo-campaign-groups">
                      {[...selectedAccountIds].map((advertiserId) => {
                        const account = accountById.get(advertiserId);
                        const list = campaignsByAccount[advertiserId] || [];
                        return (
                          <div key={advertiserId} className="bigo-campaign-group">
                            <div className="bigo-campaign-group-title">
                              {account?.name || advertiserId}
                            </div>
                            <ul className="bigo-chip-list">
                              {list.map((c) => {
                                const key = campaignKey(advertiserId, c.id);
                                const checked = selectedKeys.has(key);
                                return (
                                  <li key={key}>
                                    <label className={checked ? "bigo-chip bigo-chip--on" : "bigo-chip"}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleCampaign(advertiserId, c)}
                                      />
                                      <span>{c.name}</span>
                                    </label>
                                  </li>
                                );
                              })}
                              {!list.length ? (
                                <li className="subtle">No campaigns on this account.</li>
                              ) : null}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bigo-settings-footer">
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    disabled={saving || !selectedAccountIds.size}
                    onClick={saveSelection}
                  >
                    {saving ? "Saving…" : "Save tracking"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setSettingsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {message ? <p className="success-text">{message}</p> : null}

      {loadingMeta ? (
        <p className="subtle">Loading BIGO accounts…</p>
      ) : (
        <>
          <div className="bigo-tracked-row">
            <span className="bigo-tracked-label">Tracked</span>
            {tracked.length ? (
              <ul className="bigo-pebble-list">
                {tracked.map((row, index) => {
                  const key = campaignKey(row.advertiserId, row.campaignId);
                  const isHidden = hiddenCampaignKeys.has(key);
                  return (
                    <li
                      key={key}
                      className={isHidden ? "bigo-pebble bigo-pebble--hidden" : "bigo-pebble"}
                    >
                      <span className="bigo-pebble-index">{index + 1}.</span>
                      <span className="bigo-pebble-text" title={row.advertiserName || ""}>
                        {row.campaignName || row.campaignId}
                      </span>
                      <button
                        type="button"
                        className="bigo-pebble-visibility"
                        aria-label={isHidden ? "Show campaign" : "Hide campaign"}
                        title={isHidden ? "Show campaign" : "Hide campaign"}
                        onClick={() => toggleCampaignHidden(key)}
                      >
                        {isHidden ? (
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                              fill="currentColor"
                              d="M12 6a9.77 9.77 0 0 1 8.82 5.5 9.77 9.77 0 0 1-8.82 5.5A9.77 9.77 0 0 1 3.18 11.5 9.77 9.77 0 0 1 12 6Zm0 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9.85-9.56L3.44 21.85l-1.3-1.3L20.56 4.15l1.29 1.29Z"
                            />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                              fill="currentColor"
                              d="M12 5c5.05 0 9.27 3.11 10.82 7.5C21.27 16.89 17.05 20 12 20S2.73 16.89 1.18 12.5C2.73 8.11 6.95 5 12 5Zm0 2.5A9.77 9.77 0 0 0 3.18 12.5 9.77 9.77 0 0 0 12 18a9.77 9.77 0 0 0 8.82-5.5A9.77 9.77 0 0 0 12 7.5Zm0 1.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        className="bigo-pebble-remove"
                        aria-label={`Stop tracking ${row.campaignName || row.campaignId}`}
                        disabled={saving}
                        onClick={() => removeTracked(row)}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="subtle bigo-tracked-empty">
                No campaigns tracked — open settings to choose accounts & campaigns.
              </p>
            )}
          </div>
          {hiddenTracked.length ? (
            <p className="subtle bigo-hidden-hint">
              {hiddenTracked.length} campaign{hiddenTracked.length === 1 ? "" : "s"} hidden from
              view — metrics still count in account totals.
            </p>
          ) : null}

          <section className="bigo-adset-section">
            {!tracked.length ? (
              <p className="subtle">Track at least one campaign to load metrics.</p>
            ) : loadingLive && !hasLiveData ? (
              <p className="subtle">Loading metrics…</p>
            ) : !hasLiveData ? (
              <p className="subtle">No metrics found for tracked campaigns.</p>
            ) : (
              <div className="bigo-funnel">
                {funnelByAccount.map(({ account, campaigns }) => (
                  <div key={account.advertiserId} className="bigo-funnel-account">
                    <div className="bigo-account-summary">
                      <div className="bigo-account-summary-meta">
                        <span className="bigo-level-tag bigo-level-tag--account">Account</span>
                        <h4 className="bigo-account-summary-name">
                          {account.advertiserName || account.advertiserId}
                        </h4>
                        <span className="subtle">Today · all tracked campaigns</span>
                      </div>
                      <div className="bigo-account-summary-stats">
                        <SummaryStat label="Revenue" value={money(account.revenue, account.currency)} />
                        <SummaryStat
                          label="Cost"
                          value={money(account.cost, account.currency)}
                          deltaPct={account.costDeltaPct}
                        />
                        <SummaryStat
                          label="Profit"
                          value={money(
                            account.profit != null
                              ? account.profit
                              : calcProfit(account.revenue, account.cost),
                            account.currency
                          )}
                          tone={pnlTone(
                            account.roi != null
                              ? account.roi
                              : calcRoi(
                                  account.profit != null
                                    ? account.profit
                                    : calcProfit(account.revenue, account.cost),
                                  account.cost
                                )
                          )}
                        />
                        <SummaryStat
                          label="ROI"
                          value={formatRoi(
                            account.roi != null
                              ? account.roi
                              : calcRoi(
                                  account.profit != null
                                    ? account.profit
                                    : calcProfit(account.revenue, account.cost),
                                  account.cost
                                )
                          )}
                          tone={pnlTone(
                            account.roi != null
                              ? account.roi
                              : calcRoi(
                                  account.profit != null
                                    ? account.profit
                                    : calcProfit(account.revenue, account.cost),
                                  account.cost
                                )
                          )}
                        />
                        <SummaryStat label="Incoming" value={formatIncoming(account.incomingCalls)} />
                        <SummaryStat label="Conversion" value={account.conversions ?? 0} />
                        <SummaryStat
                          label="CPC"
                          value={formatCpc(account.cpc, account.currency)}
                          deltaPct={account.cpcDeltaPct}
                        />
                      </div>
                    </div>

                    <div className="bigo-funnel-campaigns">
                      {campaigns.map((camp) => {
                        const busy = busyCampaignId === camp.campaignId;
                        return (
                          <div
                            key={camp.key}
                            className={
                              camp.paused
                                ? "bigo-funnel-campaign bigo-funnel-campaign--paused"
                                : "bigo-funnel-campaign"
                            }
                          >
                            <div
                              className={
                                camp.paused
                                  ? "bigo-campaign-summary bigo-campaign-summary--paused"
                                  : "bigo-campaign-summary"
                              }
                            >
                              <div className="bigo-campaign-summary-left">
                                <span className="bigo-level-tag bigo-level-tag--campaign">Campaign</span>
                                <div className="bigo-campaign-summary-name">{camp.name}</div>
                              </div>
                              <div className="bigo-campaign-summary-stats">
                                <SummaryStat label="Revenue" value={money(camp.revenue, camp.currency)} />
                                <SummaryStat
                                  label="Cost"
                                  value={money(camp.cost, camp.currency)}
                                  deltaPct={camp.costDeltaPct}
                                />
                                <SummaryStat
                                  label="Profit"
                                  value={money(
                                    camp.profit != null
                                      ? camp.profit
                                      : calcProfit(camp.revenue, camp.cost),
                                    camp.currency
                                  )}
                                  tone={pnlTone(
                                    camp.roi != null
                                      ? camp.roi
                                      : calcRoi(
                                          camp.profit != null
                                            ? camp.profit
                                            : calcProfit(camp.revenue, camp.cost),
                                          camp.cost
                                        )
                                  )}
                                />
                                <SummaryStat
                                  label="ROI"
                                  value={formatRoi(
                                    camp.roi != null
                                      ? camp.roi
                                      : calcRoi(
                                          camp.profit != null
                                            ? camp.profit
                                            : calcProfit(camp.revenue, camp.cost),
                                          camp.cost
                                        )
                                  )}
                                  tone={pnlTone(
                                    camp.roi != null
                                      ? camp.roi
                                      : calcRoi(
                                          camp.profit != null
                                            ? camp.profit
                                            : calcProfit(camp.revenue, camp.cost),
                                          camp.cost
                                        )
                                  )}
                                />
                                <SummaryStat label="Incoming" value={formatIncoming(camp.incomingCalls)} />
                                <SummaryStat label="Conversion" value={camp.conversions ?? 0} />
                                <SummaryStat
                                  label="CPC"
                                  value={formatCpc(camp.cpc, camp.currency)}
                                  deltaPct={camp.cpcDeltaPct}
                                />
                              </div>
                              <div className="bigo-campaign-summary-actions">
                                <button
                                  type="button"
                                  className="bigo-visibility-btn"
                                  aria-label="Hide campaign"
                                  title="Hide campaign (keeps tracking metrics)"
                                  onClick={() => toggleCampaignHidden(camp.key)}
                                >
                                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                    <path
                                      fill="currentColor"
                                      d="M12 5c5.05 0 9.27 3.11 10.82 7.5C21.27 16.89 17.05 20 12 20S2.73 16.89 1.18 12.5C2.73 8.11 6.95 5 12 5Zm0 2.5A9.77 9.77 0 0 0 3.18 12.5 9.77 9.77 0 0 0 12 18a9.77 9.77 0 0 0 8.82-5.5A9.77 9.77 0 0 0 12 7.5Zm0 1.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
                                    />
                                  </svg>
                                </button>
                                <PauseIconButton
                                  inline
                                  showLiveLabel
                                  paused={camp.paused}
                                  busy={busy}
                                  onClick={() => toggleCampaignPause(camp)}
                                  pausedTitle="Paused — click to unpause"
                                  liveTitle="Live — click to pause"
                                  pausedLabel="Unpause campaign"
                                  liveLabel="Pause campaign"
                                />
                              </div>
                            </div>

                            <div className="bigo-funnel-adgroups">
                              <div className="bigo-funnel-adgroups-head">
                                <span className="bigo-level-tag bigo-level-tag--adgroup">Ad groups</span>
                                <span className="subtle">{camp.adsets.length}</span>
                              </div>
                              {camp.adsets.length ? (
                                <div className="bigo-adset-cards">
                                  {[...camp.adsets]
                                    .sort((a, b) => Number(Boolean(a.paused)) - Number(Boolean(b.paused)))
                                    .map((row) => {
                                    const adsetBusy = busyAdsetId === row.id;
                                    const bidBudgetBusy = busyBidBudgetAdsetId === row.id;
                                    return (
                                      <MetricsCard
                                        key={`${row.advertiserId}-${row.id}`}
                                        title={row.name}
                                        basicGoalBid={row.basicGoalBid}
                                        budget={row.budget}
                                        cost={row.cost}
                                        revenue={row.revenue}
                                        profit={row.profit}
                                        roi={row.roi}
                                        incomingCalls={row.incomingCalls}
                                        conversions={row.conversions}
                                        cpc={row.cpc}
                                        costDeltaPct={row.costDeltaPct}
                                        cpcDeltaPct={row.cpcDeltaPct}
                                        currency={row.currency}
                                        paused={Boolean(row.paused)}
                                        savingBidBudget={bidBudgetBusy}
                                        onSaveBidBudget={(values) => saveAdsetBidBudget(row, values)}
                                        pauseProps={{
                                          paused: row.paused,
                                          busy: adsetBusy || bidBudgetBusy,
                                          onClick: () => toggleAdsetPause(row),
                                          pausedTitle: "Paused — click to unpause",
                                          liveTitle: "Live — click to pause",
                                          pausedLabel: "Unpause ad set",
                                          liveLabel: "Pause ad set",
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="subtle">No ad groups for this campaign.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
