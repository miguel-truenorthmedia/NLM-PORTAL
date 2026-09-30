import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency, formatDateMedium } from "../../components/formatters.js";
import {
  createQuickBooksInvoicePayment,
  deleteQuickBooksInvoicePayment,
  fetchQuickBooksBuyersAr,
  fetchQuickBooksStatus,
  startQuickBooksConnect,
} from "../../services/api.js";

function statusClass(status) {
  const key = String(status || "").toLowerCase().replace(/_/g, "-");
  if (key === "paid") return "invoice-status invoice-status--paid";
  if (key === "overdue") return "invoice-status invoice-status--overdue";
  if (key === "due-today") return "invoice-status invoice-status--due-today";
  if (key === "partial") return "invoice-status invoice-status--partial";
  return "invoice-status invoice-status--open";
}

function statusLabel(status, amountPaid, balance) {
  if (status === "PAID") return "Paid";
  if (status === "OVERDUE") return "Overdue";
  if (status === "DUE_TODAY") return "Due today";
  if (Number(amountPaid) > 0 && Number(balance) > 0) return "Partial";
  if (status === "OPEN") return "Open";
  return status || "—";
}

function todayIso() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function emptyPaymentForm(invoice) {
  return {
    qboInvoiceId: invoice?.id || "",
    docNumber: invoice?.docNumber || "",
    qboCustomerId: invoice?.customerId || "",
    customerName: invoice?.customerName || "",
    amount: invoice?.balance > 0 ? String(invoice.balance) : "",
    paymentDate: todayIso(),
    note: "",
  };
}

export default function InvoiceBuyersTab() {
  const [buyers, setBuyers] = useState([]);
  const [asOfDate, setAsOfDate] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [needsConnect, setNeedsConnect] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const [paymentForm, setPaymentForm] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    setNeedsConnect(false);

    try {
      const qboStatus = await fetchQuickBooksStatus();
      if (!qboStatus.connected && !qboStatus.legacyEnvTokensPresent) {
        setNeedsConnect(true);
        setBuyers([]);
        return;
      }

      const result = await fetchQuickBooksBuyersAr();
      setBuyers(result.buyers || []);
      setAsOfDate(result.asOfDate || "");
      setEnvironment(result.environment || "sandbox");
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Failed to load buyer invoices";
      const status = err.response?.status;
      if (
        status === 400 ||
        status === 401 ||
        /not connected|reconnect|authorization|refresh/i.test(message)
      ) {
        setNeedsConnect(true);
      }
      setError(message);
      setBuyers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buyers;
    return buyers.filter((buyer) => {
      if (String(buyer.customerName || "").toLowerCase().includes(q)) return true;
      return (buyer.invoices || []).some((inv) =>
        String(inv.docNumber || "").toLowerCase().includes(q)
      );
    });
  }, [buyers, search]);

  const toggleBuyer = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  const openPaymentForm = (buyer, invoice) => {
    setPaymentError("");
    setPaymentForm({
      ...emptyPaymentForm({
        ...invoice,
        customerId: buyer.customerId,
        customerName: buyer.customerName,
      }),
      buyerKey: buyer.customerId || buyer.customerName,
    });
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!paymentForm) return;
    setSavingPayment(true);
    setPaymentError("");
    try {
      await createQuickBooksInvoicePayment({
        qboInvoiceId: paymentForm.qboInvoiceId,
        docNumber: paymentForm.docNumber,
        qboCustomerId: paymentForm.qboCustomerId,
        customerName: paymentForm.customerName,
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        note: paymentForm.note,
      });
      setPaymentForm(null);
      await load({ isRefresh: true });
    } catch (err) {
      setPaymentError(
        err.response?.data?.error || err.message || "Failed to save payment record"
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const removePayment = async (paymentId) => {
    if (!window.confirm("Delete this portal payment record? QuickBooks will not change.")) {
      return;
    }
    setDeletingId(paymentId);
    try {
      await deleteQuickBooksInvoicePayment(paymentId);
      await load({ isRefresh: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to delete payment");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="invoices-page invoice-buyers-page">
      <div className="section-head">
        <div>
          <h3>Buyers</h3>
          <p className="subtle">
            Buyers from QuickBooks invoices, with nested invoice history and portal payment
            records for short pays. Portal saves do not change QuickBooks.
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
          <h4>QuickBooks not connected</h4>
          <p className="subtle">Connect QuickBooks to load buyer invoices.</p>
          <button
            type="button"
            className="btn btn-inline"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? "Opening Intuit…" : "Connect QuickBooks"}
          </button>
        </div>
      ) : null}

      {!needsConnect && !loading ? (
        <div className="invoices-toolbar">
          <label className="invoices-search">
            <span className="sr-only">Search buyers</span>
            <input
              type="search"
              placeholder="Search buyer or invoice #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <p className="subtle invoices-result-count">
            {filtered.length} buyer{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      {loading ? <p className="subtle">Loading buyers from QuickBooks…</p> : null}

      {!loading && !needsConnect ? (
        <div className="invoice-buyer-list">
          {filtered.length === 0 ? (
            <div className="card">
              <p className="subtle">No buyers found for the current invoices.</p>
            </div>
          ) : (
            filtered.map((buyer) => {
              const key = buyer.customerId || buyer.customerName;
              const isOpen = expanded.has(key);
              return (
                <section key={key} className="card invoice-buyer-card">
                  <button
                    type="button"
                    className="invoice-buyer-card__head"
                    onClick={() => toggleBuyer(key)}
                    aria-expanded={isOpen}
                  >
                    <div className="invoice-buyer-card__title">
                      <span className="invoice-buyer-card__chevron" aria-hidden>
                        {isOpen ? "▾" : "▸"}
                      </span>
                      <div>
                        <h4>{buyer.customerName}</h4>
                        <p className="subtle">
                          {buyer.invoiceCount} invoice{buyer.invoiceCount === 1 ? "" : "s"}
                          {buyer.overdueCount
                            ? ` · ${buyer.overdueCount} overdue`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="invoice-buyer-card__metrics">
                      <div>
                        <span className="subtle">Invoiced</span>
                        <strong>{formatCurrency(buyer.totalInvoiced)}</strong>
                      </div>
                      <div>
                        <span className="subtle">QBO paid</span>
                        <strong>{formatCurrency(buyer.qboAmountPaid)}</strong>
                      </div>
                      <div>
                        <span className="subtle">Balance</span>
                        <strong>{formatCurrency(buyer.qboBalance)}</strong>
                      </div>
                      <div>
                        <span className="subtle">Portal recorded</span>
                        <strong>{formatCurrency(buyer.portalPaymentsTotal)}</strong>
                      </div>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="invoice-buyer-card__body">
                      <div className="table-wrap">
                        <table className="invoice-buyers-invoice-table">
                          <thead>
                            <tr>
                              <th>Invoice #</th>
                              <th>Invoice date</th>
                              <th>Due</th>
                              <th>Total</th>
                              <th>QBO paid</th>
                              <th>Balance</th>
                              <th>Status</th>
                              <th>Portal payments</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {(buyer.invoices || []).map((inv) => (
                              <tr key={inv.id}>
                                <td>
                                  <Link to={`/accounting/invoices/${encodeURIComponent(inv.id)}`}>
                                    {inv.docNumber}
                                  </Link>
                                </td>
                                <td>{formatDateMedium(inv.txnDate)}</td>
                                <td>{formatDateMedium(inv.dueDate)}</td>
                                <td>{formatCurrency(inv.totalAmount)}</td>
                                <td>{formatCurrency(inv.amountPaid)}</td>
                                <td>{formatCurrency(inv.balance)}</td>
                                <td>
                                  <span className={statusClass(
                                    Number(inv.amountPaid) > 0 && Number(inv.balance) > 0 && inv.status !== "PAID"
                                      ? "PARTIAL"
                                      : inv.status
                                  )}>
                                    {statusLabel(inv.status, inv.amountPaid, inv.balance)}
                                    {inv.status === "OVERDUE" && inv.daysOverdue != null
                                      ? ` (${inv.daysOverdue}d)`
                                      : ""}
                                  </span>
                                </td>
                                <td>
                                  {(inv.portalPayments || []).length === 0 ? (
                                    <span className="subtle">—</span>
                                  ) : (
                                    <ul className="invoice-portal-payments">
                                      {inv.portalPayments.map((p) => (
                                        <li key={p.id}>
                                          <span>
                                            {formatCurrency(p.amount)}
                                            {p.paymentDate
                                              ? ` · ${formatDateMedium(p.paymentDate)}`
                                              : ""}
                                            {p.note ? ` · ${p.note}` : ""}
                                          </span>
                                          <button
                                            type="button"
                                            className="btn-link"
                                            disabled={deletingId === p.id}
                                            onClick={() => removePayment(p.id)}
                                          >
                                            {deletingId === p.id ? "…" : "Remove"}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-inline btn-secondary"
                                    onClick={() => openPaymentForm(buyer, inv)}
                                  >
                                    Record payment
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </div>
      ) : null}

      {paymentForm ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setPaymentForm(null)}>
          <div
            className="modal-card invoice-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-payment-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="record-payment-title">Record payment</h4>
            <p className="subtle">
              Portal-only note for {paymentForm.customerName} · invoice #{paymentForm.docNumber}.
              Does not create a QuickBooks payment.
            </p>
            {paymentError ? <p className="error-text">{paymentError}</p> : null}
            <form onSubmit={submitPayment} className="invoice-payment-form">
              <label>
                Amount received
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </label>
              <label>
                Payment date
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                  }
                />
              </label>
              <label>
                Note (optional)
                <input
                  type="text"
                  placeholder="e.g. short pay, wire ref, agreed balance write-off"
                  value={paymentForm.note}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
              </label>
              <div className="invoices-actions">
                <button
                  type="button"
                  className="btn btn-inline btn-secondary"
                  onClick={() => setPaymentForm(null)}
                  disabled={savingPayment}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-inline" disabled={savingPayment}>
                  {savingPayment ? "Saving…" : "Save payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
