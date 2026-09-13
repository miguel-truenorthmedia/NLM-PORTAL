import { useEffect, useMemo, useState } from "react";
import KpiCards from "../../components/KpiCards.jsx";
import { PnLExpenseBreakdownChart, PnLTrendChart } from "../../components/PnLCharts.jsx";
import { formatCurrency, formatPercent } from "../../components/formatters.js";
import { fetchPnLHistorical } from "../../services/api.js";

export default function PnLHistoricalTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchPnLHistorical()
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err.response?.data?.error || err.message || "Failed to load historical P&L");
      })
      .finally(() => setLoading(false));
  }, []);

  const overall = data?.overall;

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

  return (
    <div className="pnl-page">
      <div className="section-head">
        <div>
          <h3>P&amp;L Historical</h3>
          <p className="subtle">
            Overall company P&amp;L across all months — campaign profit minus operating expenses. Use the monthly P&amp;L
            tab for period detail.
          </p>
        </div>
        <div className="subtle">{rangeLabel}</div>
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
    </div>
  );
}
