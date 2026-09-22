import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDateMedium } from "../../components/formatters.js";
import {
  fetchQuickBooksInvoices,
  fetchQuickBooksStatus,
  startQuickBooksConnect,
} from "../../services/api.js";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
];

const DUE_FILTERS = [
  { value: "all", label: "All dates" },
  { value: "overdue", label: "Overdue" },
  { value: "next7", label: "Due next 7 days" },
  { value: "next30", label: "Due next 30 days" },
];

const STATUS_RANK = {
  OVERDUE: 0,
  DUE_TODAY: 1,
  OPEN: 2,
  PAID: 3,
};

function statusClass(status) {
  const key = String(status || "").toLowerCase().replace(/_/g, "-");
  if (key === "paid") return "invoice-status invoice-status--paid";
  if (key === "overdue") return "invoice-status invoice-status--overdue";
  if (key === "due-today") return "invoice-status invoice-status--due-today";
  return "invoice-status invoice-status--open";
}

function statusLabel(status) {
  if (status === "DUE_TODAY") return "Due today";
  if (status === "OVERDUE") return "Overdue";
  if (status === "PAID") return "Paid";
  if (status === "OPEN") return "Open";
  return status || "—";
}

/** Compare YYYY-MM-DD as calendar strings */
function addDaysIso(iso, days) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function todayLocalIso() {
  const n = new Date();
  const yy = n.getFullYear();
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const dd = String(n.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function sortInvoices(list) {
  return [...list].sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? 99;
    const rb = STATUS_RANK[b.status] ?? 99;
    if (ra !== rb) return ra - rb;

    if (a.status === "OVERDUE") {
      return String(a.dueDate || "").localeCompare(String(b.dueDate || ""));
    }
    if (a.status === "OPEN" || a.status === "DUE_TODAY") {
      return String(a.dueDate || "").localeCompare(String(b.dueDate || ""));
    }
    // PAID — newest invoice date first
    return String(b.txnDate || "").localeCompare(String(a.txnDate || ""));
  });
}

function computeSummary(invoices, asOfDate) {
  const today = asOfDate || todayLocalIso();
  const in7 = addDaysIso(today, 7);
  const in30 = addDaysIso(today, 30);

  let totalOutstanding = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let due7Amount = 0;
  let due7Count = 0;
  let due30Amount = 0;
  let due30Count = 0;

  for (const inv of invoices) {
    const balance = Number(inv.balance) || 0;
    if (balance <= 0) continue;
    totalOutstanding += balance;
    const due = String(inv.dueDate || "");
    if (due && due < today) {
      overdueAmount += balance;
      overdueCount += 1;
    }
    if (due && due >= today && due <= in7) {
      due7Amount += balance;
      due7Count += 1;
    }
    if (due && due >= today && due <= in30) {
      due30Amount += balance;
      due30Count += 1;
    }
  }

  return {
    totalOutstanding,
    overdue: { amount: overdueAmount, count: overdueCount },
    dueNext7Days: { amount: due7Amount, count: due7Count },
    dueNext30Days: { amount: due30Amount, count: due30Count },
  };
}

export default function InvoicesTab() {
  const navigate = useNavigate();
  const [statusInfo, setStatusInfo] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [asOfDate, setAsOfDate] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [needsConnect, setNeedsConnect] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    setNeedsConnect(false);

    try {
      const qboStatus = await fetchQuickBooksStatus();
      setStatusInfo(qboStatus);

      if (!qboStatus.connected && !qboStatus.legacyEnvTokensPresent) {
        setNeedsConnect(true);
        setInvoices([]);
        setSummary(null);
        return;
      }

      const result = await fetchQuickBooksInvoices({ limit: 1000 });
      const rows = result.invoices || [];
      setInvoices(rows);
      setAsOfDate(result.asOfDate || result.summary?.asOfDate || "");
      setEnvironment(result.environment || "sandbox");
      setSummary(result.summary || computeSummary(rows, result.asOfDate));
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Failed to load QuickBooks invoices";
      const status = err.response?.status;
      if (
        status === 400 ||
        status === 401 ||
        /not connected|reconnect|authorization|refresh/i.test(message)
      ) {
        setNeedsConnect(true);
      }
      setError(message);
      setInvoices([]);
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const result = await startQuickBooksConnect();
      if (result.authorizeUrl) {
        window.location.assign(result.authorizeUrl);
        return;
      }
      setError("Could not start QuickBooks connect");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to start QuickBooks connect");
    } finally {
      setConnecting(false);
    }
  };

  const filteredRows = useMemo(() => {
    const today = asOfDate || todayLocalIso();
    const in7 = addDaysIso(today, 7);
    const in30 = addDaysIso(today, 30);
    const needle = search.trim().toLowerCase();

    const rows = invoices.filter((inv) => {
      if (statusFilter === "OPEN") {
        if (inv.status !== "OPEN" && inv.status !== "DUE_TODAY") return false;
      } else if (statusFilter !== "all" && inv.status !== statusFilter) {
        return false;
      }

      const due = String(inv.dueDate || "");
      const balance = Number(inv.balance) || 0;
      if (dueFilter === "overdue") {
        if (!(balance > 0 && due && due < today)) return false;
      } else if (dueFilter === "next7") {
        if (!(balance > 0 && due && due >= today && due <= in7)) return false;
      } else if (dueFilter === "next30") {
        if (!(balance > 0 && due && due >= today && due <= in30)) return false;
      }

      if (needle) {
        const hay = `${inv.docNumber || ""} ${inv.customerName || ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    return sortInvoices(rows);
  }, [invoices, statusFilter, dueFilter, search, asOfDate]);

  const displaySummary = summary;

  return (
    <div className="invoices-page">
      <div className="section-head">
        <div>
          <h3>Invoices</h3>
          <p className="subtle">
            Accounts receivable from QuickBooks (source of truth).{" "}
            {environment === "sandbox" ? (
              <strong>Sandbox mode</strong>
            ) : (
              "Live company"
            )}
            {asOfDate ? ` · as of ${formatDateMedium(asOfDate)}` : ""}.
          </p>
        </div>
        <div className="invoices-actions">
          {!needsConnect ? (
            <button
              type="button"
              className="btn btn-inline"
              onClick={() => load({ isRefresh: true })}
              disabled={loading || refreshing}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {needsConnect ? (
        <div className="card invoices-connect-card">
          <h4>
            {/reconnect|expired|authorization/i.test(error)
              ? "QuickBooks reconnect required"
              : "QuickBooks not connected"}
          </h4>
          <p className="subtle">
            {/reconnect|expired|authorization/i.test(error)
              ? "Your QuickBooks session expired. Reconnect the sandbox company to reload invoices."
              : "Connect your QuickBooks sandbox company to load invoices. Tokens stay on the server."}
          </p>
          <button
            type="button"
            className="btn btn-inline"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting
              ? "Opening Intuit…"
              : /reconnect|expired|authorization/i.test(error)
                ? "Reconnect QuickBooks"
                : "Connect QuickBooks"}
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="invoices-loading" aria-busy="true">
          <div className="kpi-grid kpi-grid--compact invoices-kpi-grid">
            {[1, 2, 3, 4].map((i) => (
              <article key={i} className="kpi-card invoices-kpi-skeleton">
                <p className="kpi-label">Loading…</p>
                <p className="kpi-value">—</p>
              </article>
            ))}
          </div>
          <p className="subtle">Loading invoices from QuickBooks…</p>
        </div>
      ) : null}

      {!loading && !needsConnect ? (
        <>
          <div className="kpi-grid kpi-grid--compact invoices-kpi-grid">
            <article className="kpi-card kpi-card--revenue">
              <p className="kpi-label">Total Outstanding</p>
              <p className="kpi-value">
                {formatCurrency(displaySummary?.totalOutstanding || 0)}
              </p>
            </article>
            <article className="kpi-card kpi-card--spend">
              <p className="kpi-label">Overdue</p>
              <p className="kpi-value">{formatCurrency(displaySummary?.overdue?.amount || 0)}</p>
              <p className="subtle invoices-kpi-meta">
                {displaySummary?.overdue?.count || 0} invoices
              </p>
            </article>
            <article className="kpi-card kpi-card--calls">
              <p className="kpi-label">Due Next 7 Days</p>
              <p className="kpi-value">
                {formatCurrency(displaySummary?.dueNext7Days?.amount || 0)}
              </p>
              <p className="subtle invoices-kpi-meta">
                {displaySummary?.dueNext7Days?.count || 0} invoices
              </p>
            </article>
            <article className="kpi-card kpi-card--converted">
              <p className="kpi-label">Due Next 30 Days</p>
              <p className="kpi-value">
                {formatCurrency(displaySummary?.dueNext30Days?.amount || 0)}
              </p>
              <p className="subtle invoices-kpi-meta">
                {displaySummary?.dueNext30Days?.count || 0} invoices
              </p>
            </article>
          </div>

          <div className="invoices-filters card">
            <label>
              Status
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
                {DUE_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="invoices-search">
              Search
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Invoice # or customer"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="subtle">
                        {invoices.length === 0
                          ? "No invoices found in QuickBooks."
                          : "No invoices match these filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((inv) => (
                      <tr
                        key={inv.id}
                        className="invoices-table-row--clickable"
                        tabIndex={0}
                        role="link"
                        aria-label={`Open invoice ${inv.docNumber}`}
                        onClick={() => navigate(`/accounting/invoices/${inv.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/accounting/invoices/${inv.id}`);
                          }
                        }}
                      >
                        <td>
                          <strong className="invoices-doc-link">{inv.docNumber}</strong>
                        </td>
                        <td>{inv.customerName || "—"}</td>
                        <td>{formatDateMedium(inv.txnDate) || "—"}</td>
                        <td>{formatDateMedium(inv.dueDate) || "—"}</td>
                        <td>{formatCurrency(inv.totalAmount)}</td>
                        <td>{formatCurrency(inv.balance)}</td>
                        <td>
                          <span className={statusClass(inv.status)}>{statusLabel(inv.status)}</span>
                          {inv.status === "OVERDUE" && inv.daysOverdue != null ? (
                            <div className="subtle invoices-days-meta">
                              {inv.daysOverdue} day{inv.daysOverdue === 1 ? "" : "s"}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="subtle invoices-footer">
              Showing {filteredRows.length} of {invoices.length} invoices
              {statusInfo?.connectedBy?.name
                ? ` · connected by ${statusInfo.connectedBy.name}`
                : ""}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
