import { useEffect, useMemo, useState } from "react";
import KpiCards from "../../components/KpiCards.jsx";
import { PnLExpenseBreakdownChart, PnLTrendChart } from "../../components/PnLCharts.jsx";
import { formatCurrency, formatPercent } from "../../components/formatters.js";
import {
  createPnLExpense,
  deletePnLExpense,
  fetchPnLOverview,
  syncRingbaPnLBilling,
} from "../../services/api.js";

function currentMonthKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function shiftMonth(month, delta) {
  const [year, mon] = String(month).split("-").map(Number);
  const date = new Date(year, mon - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function Delta({ value, pct }) {
  const up = value > 0;
  const down = value < 0;
  const cls = up ? "pnl-delta pnl-delta--up" : down ? "pnl-delta pnl-delta--down" : "pnl-delta";
  const arrow = up ? "▲" : down ? "▼" : "•";
  return (
    <span className={cls}>
      {arrow} {formatCurrency(Math.abs(value))} ({formatPercent(Math.abs(pct))})
    </span>
  );
}

const EMPTY_FORM = {
  description: "",
  amount: "",
  category: "Ringba",
  date: "",
  notes: "",
};

export default function PnLTab() {
  const [month, setMonth] = useState(currentMonthKey);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    return fetchPnLOverview(month)
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err.response?.data?.error || err.message || "Failed to load P&L");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [month]);

  const current = data?.current;
  const previous = data?.previous;
  const comparison = data?.comparison;
  const categories = data?.meta?.categories || ["Other"];

  const kpiItems = useMemo(() => {
    if (!current) return [];
    return [
      { label: "Revenue", value: current.revenue, type: "currency", tone: "revenue" },
      { label: "Ad Spend", value: current.adSpend, type: "currency", tone: "spend" },
      { label: "Campaign Profit", value: current.campaignProfit, type: "currency", tone: "profit" },
      { label: "Operating Expenses", value: current.operatingExpenses, type: "currency", tone: "spend" },
      { label: "Net Profit", value: current.netProfit, type: "currency", tone: "profit" },
      { label: "Net Margin", value: current.netMargin, type: "percent", tone: "roi" },
    ];
  }, [current]);

  const expenseChartData = useMemo(() => {
    if (!current?.expensesByCategory) return [];
    return Object.entries(current.expensesByCategory)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({ category, amount }));
  }, [current]);

  const syncRingba = async () => {
    setSyncing(true);
    setSyncMessage("");
    setError("");
    try {
      const result = await syncRingbaPnLBilling(5);
      setSyncMessage(
        `Ringba sync: ${result.imported} new/updated, ${result.unchanged} unchanged, ${result.skipped} skipped (${result.fetched} fetched).`
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to sync Ringba billing");
    } finally {
      setSyncing(false);
    }
  };

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, category: categories[0] || "Other" });
    setFormError("");
    setShowAdd(true);
  };

  const closeAdd = () => {
    if (submitting) return;
    setShowAdd(false);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const submitAdd = async (event) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await createPnLExpense({
        month,
        description: form.description,
        amount: form.amount,
        category: form.category,
        date: form.date,
        notes: form.notes,
        source: "manual",
      });
      closeAdd();
      await load();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const removeExpense = async (id) => {
    if (
      !window.confirm(
        "Hide this expense from monthly P&L? It will still appear on P&L Historical."
      )
    ) {
      return;
    }
    setDeletingId(id);
    setError("");
    try {
      await deletePnLExpense(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to hide expense");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="pnl-page">
      <div className="section-head">
        <div>
          <h3>Profit &amp; Loss</h3>
          <p className="subtle">
            Campaign profit (revenue − ad spend) minus OpEx. Ringba bills sync from API every 3 days; company ledger
            expenses are stored separately (BIGO excluded — already in ad spend).
          </p>
        </div>
        <div className="pnl-month-nav">
          <button type="button" className="preset" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">
            ‹
          </button>
          <label className="pnl-month-picker">
            <span className="visually-hidden">Month</span>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <button type="button" className="preset" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Next month">
            ›
          </button>
          <button type="button" className="preset" onClick={syncRingba} disabled={syncing || loading}>
            {syncing ? "Syncing..." : "Sync Ringba bills"}
          </button>
          <button type="button" className="btn btn-inline" onClick={openAdd}>
            Add expense
          </button>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {syncMessage ? <p className="subtle">{syncMessage}</p> : null}
      {loading ? <p className="subtle">Loading P&amp;L...</p> : null}

      {!loading && current ? (
        <>
          <div
            className={`pnl-verdict card${
              data.meta?.betterThanLastMonth ? " pnl-verdict--better" : " pnl-verdict--worse"
            }`}
          >
            <div>
              <strong>{current.label}</strong>
              <p className="subtle">
                {data.meta?.betterThanLastMonth
                  ? "Net profit is up vs last month"
                  : "Net profit is flat or down vs last month"}
              </p>
            </div>
            <div className="pnl-verdict-figures">
              <div>
                <span className="subtle">This month</span>
                <strong className={current.netProfit >= 0 ? "pnl-positive" : "pnl-negative"}>
                  {formatCurrency(current.netProfit)}
                </strong>
              </div>
              <div>
                <span className="subtle">Last month</span>
                <strong>{formatCurrency(previous?.netProfit || 0)}</strong>
              </div>
              {comparison?.netProfit ? <Delta value={comparison.netProfit.delta} pct={comparison.netProfit.pct} /> : null}
            </div>
          </div>

          <KpiCards items={kpiItems} />

          <div className="pnl-compare-grid">
            {[
              { key: "revenue", label: "Revenue" },
              { key: "adSpend", label: "Ad Spend" },
              { key: "campaignProfit", label: "Campaign Profit" },
              { key: "operatingExpenses", label: "OpEx" },
            ].map(({ key, label }) => {
              const row = comparison?.[key];
              if (!row) return null;
              return (
                <div className="card pnl-compare-card" key={key}>
                  <p className="kpi-label">{label} vs last month</p>
                  <p className="kpi-value">{formatCurrency(row.current)}</p>
                  <Delta value={row.delta} pct={row.pct} />
                </div>
              );
            })}
          </div>

          <div className="pnl-charts-grid">
            <PnLTrendChart data={data.trend || []} />
            <PnLExpenseBreakdownChart data={expenseChartData} />
          </div>

          <div className="card">
            <h3>Statement</h3>
            <p className="subtle">Campaign profit matches the Profit column on Campaign Performance for this month.</p>
            <div className="table-wrap">
              <table className="pnl-statement-table">
                <tbody>
                  <tr>
                    <td>Revenue</td>
                    <td>{formatCurrency(current.revenue)}</td>
                  </tr>
                  <tr>
                    <td>Ad spend</td>
                    <td className="pnl-negative">({formatCurrency(current.adSpend)})</td>
                  </tr>
                  <tr className="pnl-row-subtotal">
                    <td>Campaign profit (gross)</td>
                    <td className={current.campaignProfit >= 0 ? "pnl-positive" : "pnl-negative"}>
                      {formatCurrency(current.campaignProfit)}
                    </td>
                  </tr>
                  <tr>
                    <td>Gross margin</td>
                    <td>{formatPercent(current.grossMargin)}</td>
                  </tr>
                  <tr>
                    <td>Operating expenses</td>
                    <td className="pnl-negative">({formatCurrency(current.operatingExpenses)})</td>
                  </tr>
                  <tr className="pnl-row-total">
                    <td>Net profit</td>
                    <td className={current.netProfit >= 0 ? "pnl-positive" : "pnl-negative"}>
                      {formatCurrency(current.netProfit)}
                    </td>
                  </tr>
                  <tr>
                    <td>Net margin</td>
                    <td>{formatPercent(current.netMargin)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <div>
                <h3>Operating expenses</h3>
                <p className="subtle">
                  Ringba = live billing sync. Import/manual = company ledger (software, payroll, legal, etc.).
                </p>
              </div>
              <button type="button" className="btn btn-inline" onClick={openAdd}>
                Add expense
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Platform</th>
                    <th>Category</th>
                    <th>Details</th>
                    <th>Payment</th>
                    <th>Source</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(data.expenses || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="subtle">
                        No expenses for {current.label} yet.
                      </td>
                    </tr>
                  ) : (
                    data.expenses.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date || "—"}</td>
                        <td>{row.platform || "—"}</td>
                        <td>{row.category}</td>
                        <td>
                          <strong>{row.description}</strong>
                          {row.notes ? <div className="subtle">{row.notes}</div> : null}
                          {row.receiptSaved ? <div className="subtle">Receipt saved</div> : null}
                        </td>
                        <td className="subtle">{row.paymentMethod || "—"}</td>
                        <td>
                          <span className={`pnl-source pnl-source--${row.source}`}>{row.source}</span>
                        </td>
                        <td>{formatCurrency(row.amount)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            disabled={deletingId === row.id}
                            onClick={() => removeExpense(row.id)}
                            title="Hide from monthly P&L (keeps on Historical)"
                          >
                            {deletingId === row.id ? "..." : "Hide"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {showAdd ? (
        <div className="modal-backdrop" role="presentation" onClick={closeAdd}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Add expense"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add expense</h3>
            <p className="subtle">Saved to {month}. Use category “Ringba” for platform fees until auto-sync is live.</p>
            <form className="spend-form" onSubmit={submitAdd}>
              <label>
                Description
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  autoFocus
                />
              </label>
              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date (optional)
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </label>
              <label>
                Notes (optional)
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
              {formError ? <p className="error-text">{formError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="preset" onClick={closeAdd} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-inline" disabled={submitting}>
                  {submitting ? "Saving..." : "Save expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
