import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatCurrency, formatDateMedium } from "../../components/formatters.js";
import {
  fetchQuickBooksInvoice,
  fetchQuickBooksStatus,
  startQuickBooksConnect,
} from "../../services/api.js";

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

function formatAddress(addr) {
  if (!addr) return "";
  const lines = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
    addr.country,
  ].filter((line) => String(line || "").trim());
  return lines;
}

function formatQty(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : String(n);
}

function formatRate(value) {
  if (value == null || value === "") return "—";
  return formatCurrency(value);
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [asOfDate, setAsOfDate] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [needsConnect, setNeedsConnect] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNeedsConnect(false);
    setNotFound(false);
    setInvoice(null);

    try {
      const qboStatus = await fetchQuickBooksStatus();
      if (!qboStatus.connected && !qboStatus.legacyEnvTokensPresent) {
        setNeedsConnect(true);
        return;
      }

      const result = await fetchQuickBooksInvoice(invoiceId);
      setInvoice(result.invoice || null);
      setAsOfDate(result.asOfDate || "");
      setEnvironment(result.environment || "sandbox");
      if (!result.invoice) setNotFound(true);
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Failed to load invoice";
      const status = err.response?.status;
      if (status === 404) {
        setNotFound(true);
        setError("");
      } else if (
        status === 400 ||
        status === 401 ||
        /not connected|reconnect|authorization|refresh/i.test(message)
      ) {
        setNeedsConnect(true);
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

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

  const customer = invoice?.customer || {};
  const addressLines = formatAddress(customer.billingAddress);
  const dueHint =
    invoice?.status === "OVERDUE" && invoice.daysOverdue != null
      ? `${invoice.daysOverdue} day${invoice.daysOverdue === 1 ? "" : "s"} overdue`
      : invoice?.status === "DUE_TODAY"
        ? "Due today"
        : invoice?.status === "OPEN" && invoice.daysUntilDue != null
          ? `Due in ${invoice.daysUntilDue} day${invoice.daysUntilDue === 1 ? "" : "s"}`
          : "";

  return (
    <div className="invoice-detail-page">
      <div className="section-head">
        <div>
          <p className="subtle invoice-detail-crumb">
            <Link to="/accounting/invoices">Invoices</Link>
            {invoice?.docNumber ? ` / #${invoice.docNumber}` : ""}
          </p>
          <h3>
            {loading
              ? "Invoice"
              : invoice?.docNumber
                ? `Invoice #${invoice.docNumber}`
                : "Invoice"}
          </h3>
          <p className="subtle">
            QuickBooks source of truth
            {environment === "sandbox" ? (
              <>
                {" "}
                · <strong>Sandbox mode</strong>
              </>
            ) : null}
            {asOfDate ? ` · as of ${formatDateMedium(asOfDate)}` : ""}.
          </p>
        </div>
        <div className="invoices-actions">
          <button
            type="button"
            className="btn btn-inline"
            onClick={() => navigate("/accounting/invoices")}
          >
            Back to Invoices
          </button>
          {invoice?.qboDeepLink ? (
            <a
              className="btn btn-inline btn-secondary"
              href={invoice.qboDeepLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in QuickBooks
            </a>
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
            Connect the sandbox company to load this invoice. Tokens stay on the server.
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
        <div className="card invoice-detail-loading" aria-busy="true">
          <p className="subtle">Loading invoice from QuickBooks…</p>
        </div>
      ) : null}

      {!loading && notFound && !needsConnect ? (
        <div className="card invoices-connect-card">
          <h4>Invoice not found</h4>
          <p className="subtle">
            QuickBooks did not return an invoice for this id. It may have been deleted in the
            sandbox company.
          </p>
          <Link className="btn btn-inline" to="/accounting/invoices">
            Back to Invoices
          </Link>
        </div>
      ) : null}

      {!loading && invoice && !needsConnect ? (
        <>
          <div className="invoice-detail-header card">
            <div className="invoice-detail-header-main">
              <div className="invoice-detail-title-row">
                <h4>Invoice #{invoice.docNumber}</h4>
                <span className={statusClass(invoice.status)}>{statusLabel(invoice.status)}</span>
              </div>
              <p className="invoice-detail-customer-name">{customer.name || "—"}</p>
              {dueHint ? <p className="subtle invoice-detail-due-hint">{dueHint}</p> : null}
            </div>
          </div>

          <div className="invoice-detail-summary-grid">
            <article className="kpi-card">
              <p className="kpi-label">Invoice Date</p>
              <p className="kpi-value kpi-value--sm">{formatDateMedium(invoice.txnDate) || "—"}</p>
            </article>
            <article className="kpi-card">
              <p className="kpi-label">Due Date</p>
              <p className="kpi-value kpi-value--sm">{formatDateMedium(invoice.dueDate) || "—"}</p>
            </article>
            <article className="kpi-card">
              <p className="kpi-label">Original Total</p>
              <p className="kpi-value kpi-value--sm">{formatCurrency(invoice.totalAmount)}</p>
            </article>
            <article className="kpi-card">
              <p className="kpi-label">Amount Paid</p>
              <p className="kpi-value kpi-value--sm">{formatCurrency(invoice.amountPaid)}</p>
            </article>
            <article className="kpi-card kpi-card--spend invoice-detail-balance-card">
              <p className="kpi-label">Remaining Balance</p>
              <p className="kpi-value">{formatCurrency(invoice.balance)}</p>
            </article>
          </div>

          <div className="invoice-detail-columns">
            <section className="card invoice-detail-section">
              <h4>Customer</h4>
              <dl className="invoice-detail-dl">
                <div>
                  <dt>Name</dt>
                  <dd>{customer.name || "—"}</dd>
                </div>
                {customer.email ? (
                  <div>
                    <dt>Billing Email</dt>
                    <dd>{customer.email}</dd>
                  </div>
                ) : null}
                {addressLines.length > 0 ? (
                  <div>
                    <dt>Billing Address</dt>
                    <dd>
                      {addressLines.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="card invoice-detail-section">
              <h4>Notes</h4>
              {invoice.customerMemo ? (
                <div className="invoice-detail-note">
                  <p className="subtle invoice-detail-note-label">Customer memo</p>
                  <p>{invoice.customerMemo}</p>
                </div>
              ) : null}
              {invoice.privateNote ? (
                <div className="invoice-detail-note">
                  <p className="subtle invoice-detail-note-label">Internal QuickBooks Note</p>
                  <p>{invoice.privateNote}</p>
                </div>
              ) : null}
              {!invoice.customerMemo && !invoice.privateNote ? (
                <p className="subtle">No notes on this invoice.</p>
              ) : null}
            </section>
          </div>

          <section className="card invoice-detail-section">
            <h4>Line items</h4>
            <div className="table-wrap">
              <table className="invoice-lines-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.lineItems || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="subtle">
                        No line items on this invoice.
                      </td>
                    </tr>
                  ) : (
                    invoice.lineItems.map((line, idx) => (
                      <tr key={line.id || `${idx}-${line.description}`}>
                        <td>
                          {line.description || line.itemName || "—"}
                          {line.itemName &&
                          line.description &&
                          line.itemName !== line.description ? (
                            <div className="subtle invoices-days-meta">{line.itemName}</div>
                          ) : null}
                        </td>
                        <td>{formatQty(line.quantity)}</td>
                        <td>{formatRate(line.unitPrice)}</td>
                        <td>{formatCurrency(line.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
