import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HomePerformanceChart from "../components/HomePerformanceChart.jsx";
import KpiCards from "../components/KpiCards.jsx";
import { formatDateRange } from "../components/formatters.js";
import { fetchCampaignDaily } from "../services/api.js";
import { aggregateRowsByDate, getDayCount, getLast7DaysRange } from "../utils/dateHelpers.js";

const FE_CAMPAIGN_ID = "CAf073c253e2244171ac7c49a892f85299";
const FE_CAMPAIGN_NAME = "NLM - Final Expense";
const defaultRange = getLast7DaysRange();

export default function HomePage() {
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [loading, setLoading] = useState(true);
  const [chartRows, setChartRows] = useState([]);
  const [summary, setSummary] = useState({});

  const dayCount = useMemo(() => getDayCount(startDate, endDate), [startDate, endDate]);
  const periodLabel = dayCount === 1 ? "1-Day" : `${dayCount}-Day`;

  useEffect(() => {
    if (!startDate || !endDate || startDate > endDate) return;

    setLoading(true);
    fetchCampaignDaily(startDate, endDate, {
      offerType: "FE",
      campaignId: FE_CAMPAIGN_ID,
      adAccountId: "",
    })
      .then((data) => {
        const aggregated = aggregateRowsByDate(data.rows || []);
        setChartRows(aggregated);
        setSummary(data.summary || {});
      })
      .catch(() => {
        setChartRows([]);
        setSummary({});
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const summaryCards = useMemo(
    () => [
      { label: `${periodLabel} Spend`, value: summary.totalSpend, type: "currency", tone: "spend" },
      { label: `${periodLabel} Revenue`, value: summary.totalRevenue, type: "currency", tone: "revenue" },
      { label: `${periodLabel} Profit`, value: summary.totalProfit, type: "currency", tone: "profit" },
      { label: "Calls", value: summary.totalCalls, type: "text", tone: "calls" },
      { label: "Converted", value: summary.totalConvertedCalls, type: "text", tone: "converted" },
      { label: "AVG ROI", value: summary.avgRoi, type: "percent", tone: "roi" },
    ],
    [summary, periodLabel]
  );

  return (
    <section className="home-page">
      <div className="home-hero card">
        <div className="home-hero-main">
          <p className="home-eyebrow">NorthernLeads Media</p>
          <h2>Campaign Overview</h2>
          <p className="subtle">
            {FE_CAMPAIGN_NAME} · {formatDateRange(startDate, endDate)}
          </p>
          <div className="home-date-filters">
            <label>
              From
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
        </div>
        <div className="home-hero-badges">
          <span className="badge badge-fe">Final Expense</span>
          <span className="badge badge-live">Live from Ringba</span>
        </div>
      </div>

      {startDate > endDate ? (
        <p className="error-text">Start date must be on or before end date.</p>
      ) : null}
      {loading ? <p className="subtle">Loading campaign performance...</p> : null}
      <KpiCards items={summaryCards} />
      <HomePerformanceChart
        data={chartRows}
        title={`${periodLabel} Performance`}
        subtitle={`Revenue, ad spend, and profit by day · ${formatDateRange(startDate, endDate)}`}
      />

      <div className="home-grid">
        <div className="card home-card home-card-campaigns">
          <h3>Campaign Performance</h3>
          <p className="subtle">
            Drill into spend, revenue, profit, ROI, and conversion rate by offer, campaign, and ad account.
          </p>
          <Link className="btn btn-inline" to="/campaigns">
            Open Campaign Performance
          </Link>
        </div>
        <div className="card home-card home-card-recon">
          <h3>Reconciliation</h3>
          <p className="subtle">
            Review sold calls by campaign and buyer. Download weekly CSV reports for media buyers.
          </p>
          <Link className="btn btn-inline btn-secondary" to="/reconciliation">
            Open Reconciliation
          </Link>
        </div>
      </div>
    </section>
  );
}
