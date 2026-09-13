import { useEffect, useMemo, useState } from "react";
import KpiCards from "../../components/KpiCards.jsx";
import { PnLExpenseBreakdownChart, PnLTrendChart } from "../../components/PnLCharts.jsx";
import { formatCurrency, formatPercent } from "../../components/formatters.js";
import { createPnLExpense, fetchPnLHistorical } from "../../services/api.js";

const EMPTY_FORM = {
  description: "",
  amount: "",
  category: "Other",
  platform: "",
  date: "",
  paymentMethod: "",
  notes: "",
  /** "both" | "historical" */
  visibility: "historical",
};

export default function PnLHistoricalTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    return fetchPnLHistorical()
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err.response?.data?.error || err.message || "Failed to load historical P&L");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const overall = data?.overall;
  const categories = data?.meta?.categories || ["Other"];

  const kpiItems = useMemo(() => {
    if (!overall) return [];
    return [
      { label: "Lifetime Revenue", value: overall.revenue, type: "currency", tone: "revenue" },
      { label: "Lifetime Ad Spend", value: overall.adSpend, type: "currency", tone: "spend" },
      { label: "Lifetime Campaign Profit", value: overall.campaignProfit, type: "currency", tone: "profit" },
      { label: "Lifetime OpEx", value: overall.operatingExpenses, type: "currency", tone: "spend" },
      { label: "Lifetime Net Profit", value: overall.netProfit, type: "currency", tone: "profit" },
      { label: "Net Margin", value: overall.netMargin, type: "percent", tone: "roi" },
    ];
  }, [overall]);

  const categoryChartData = useMemo(() => {
    const map = data?.expensesByCategory || {};
    return Object.entries(map)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const platformChartData = useMemo(() => {
    const map = data?.expensesByPlatform || {};
    return Object.entries(map)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 12);
  }, [data]);

  const rangeLabel =
    data?.range?.startDate && data?.range?.endDate
      ? `${data.range.startDate} → ${data.range.endDate}`
      : "All available data";

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, category: categories.includes("Contractors") ? "Contractors" : categories[0] || "Other" });
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

    const showOnBoth = form.visibility === "both";
    const confirmed = window.confirm(
      showOnBoth
        ? "Show this expense on both monthly P&L and P&L Historical?\n\nOK to save on both tabs."
        : "Show this expense on P&L Historical only (hidden from monthly P&L)?\n\nOK to save as Historical-only."
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const date = String(form.date || "").trim();
      const month = date ? date.slice(0, 7) : undefined;
      await createPnLExpense({
        month,
        description: form.description,
        amount: form.amount,
        category: form.category,
        platform: form.platform,
        date,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        source: "manual",
        historicalOnly: !showOnBoth,
      });
      closeAdd();
      await load();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pnl-page">
      <div className="section-head">
        <div>
          <h3>P&amp;L Historical</h3>
          <p className="subtle">
            Overall company P&amp;L across all months — campaign profit minus operating expenses. Use the monthly P&amp;L
            tab for period detail. Special payouts (e.g. Elijay) stay here only.
          </p>
        </div>
        <div className="pnl-month-nav">
          <div className="subtle">{rangeLabel}</div>
          <button type="button" className="btn btn-inline" onClick={openAdd}>
            Add expense
          </button>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="subtle">Loading historical P&amp;L...</p> : null}

      {!loading && overall ? (
        <>
          <div className={`pnl-verdict card${overall.netProfit >= 0 ? " pnl-verdict--better" : " pnl-verdict--worse"}`}>
            <div>
              <strong>Company position</strong>
              <p className="subtle">
                {data.meta?.monthsCovered || 0} months of history · {data.expenseCount || 0} expense line items
              </p>
            </div>
            <div className="pnl-verdict-figures">
              <div>
                <span className="subtle">Lifetime net</span>
                <strong className={overall.netProfit >= 0 ? "pnl-positive" : "pnl-negative"}>
                  {formatCurrency(overall.netProfit)}
                </strong>
              </div>
              <div>
                <span className="subtle">Gross margin</span>
                <strong>{formatPercent(overall.grossMargin)}</strong>
              </div>
              <div>
                <span className="subtle">Net margin</span>
                <strong>{formatPercent(overall.netMargin)}</strong>
              </div>
            </div>
          </div>

          <KpiCards items={kpiItems} />

          <div className="pnl-charts-grid">
            <PnLTrendChart
              data={data.trend || []}
              title="Full history trend"
              subtitle="Month-by-month revenue, spend, campaign profit, and net"
            />
            <PnLExpenseBreakdownChart
              data={categoryChartData}
              title="Lifetime expenses by category"
              subtitle="All operating costs rolled up"
            />
          </div>

          <div className="pnl-charts-grid">
            <PnLExpenseBreakdownChart
              data={platformChartData}
              title="Top platforms (lifetime)"
              subtitle="Largest expense platforms across all time"
            />
            <div className="card">
              <h3>Lifetime statement</h3>
              <p className="subtle">Campaign profit matches Campaign Performance profit for the full date range.</p>
              <div className="table-wrap">
                <table className="pnl-statement-table">
                  <tbody>
                    <tr>
                      <td>Revenue</td>
                      <td>{formatCurrency(overall.revenue)}</td>
                    </tr>
                    <tr>
                      <td>Ad spend</td>
                      <td className="pnl-negative">({formatCurrency(overall.adSpend)})</td>
                    </tr>
                    <tr className="pnl-row-subtotal">
                      <td>Campaign profit (gross)</td>
                      <td className={overall.campaignProfit >= 0 ? "pnl-positive" : "pnl-negative"}>
                        {formatCurrency(overall.campaignProfit)}
                      </td>
                    </tr>
                    <tr>
                      <td>Gross margin</td>
                      <td>{formatPercent(overall.grossMargin)}</td>
                    </tr>
                    <tr>
                      <td>Operating expenses</td>
                      <td className="pnl-negative">({formatCurrency(overall.operatingExpenses)})</td>
                    </tr>
                    <tr className="pnl-row-total">
                      <td>Net profit</td>
                      <td className={overall.netProfit >= 0 ? "pnl-positive" : "pnl-negative"}>
                        {formatCurrency(overall.netProfit)}
                      </td>
                    </tr>
                    <tr>
                      <td>Net margin</td>
                      <td>{formatPercent(overall.netMargin)}</td>
                    </tr>
                    <tr>
                      <td>Calls / Converted</td>
                      <td>
                        {overall.calls} / {overall.convertedCalls}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
            <p className="subtle">
              Special payouts (e.g. Elijay) should usually be Historical only so they do not hit monthly P&amp;L.
            </p>
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
                Platform (optional)
                <input
                  type="text"
                  value={form.platform}
                  onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
                  placeholder="e.g. Elijay"
                />
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
                Payment method (optional)
                <input
                  type="text"
                  value={form.paymentMethod}
                  onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
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
              <fieldset className="pnl-visibility-fieldset">
                <legend>Where should this appear?</legend>
                <label className="pnl-visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    checked={form.visibility === "historical"}
                    onChange={() => setForm((prev) => ({ ...prev, visibility: "historical" }))}
                  />
                  <span>P&amp;L Historical only</span>
                </label>
                <label className="pnl-visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    checked={form.visibility === "both"}
                    onChange={() => setForm((prev) => ({ ...prev, visibility: "both" }))}
                  />
                  <span>Both monthly P&amp;L and P&amp;L Historical</span>
                </label>
              </fieldset>
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
