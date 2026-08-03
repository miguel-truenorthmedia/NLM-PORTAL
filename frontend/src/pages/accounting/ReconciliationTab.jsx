import { useEffect, useMemo, useState } from "react";
import {
  fetchReconciliation,
  fetchReconciliationBuyers,
  fetchReconciliationFilters,
} from "../../services/api.js";
import { formatCurrency, formatDateRange } from "../../components/formatters.js";
import { downloadSoldCallsCsv } from "../../utils/csvExport.js";

function FilterChip({ label, value }) {
  return (
    <span className="filter-chip">
      <strong>{label}:</strong> {value}
    </span>
  );
}

function shiftIsoDate(isoDate, days) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ReconciliationTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [data, setData] = useState({ summary: {}, calls: [] });
  const [loading, setLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [dataSource, setDataSource] = useState("ringba");

  useEffect(() => {
    fetchReconciliationFilters()
      .then((filters) => {
        setDataSource(filters.dataSource || "ringba");
        setStartDate(filters.defaultRange?.startDate || "");
        setEndDate(filters.defaultRange?.endDate || "");
        setCampaigns(filters.campaigns || []);
        setCampaignName(filters.defaultCampaign?.name || "");
        setBuyerName(filters.defaultBuyer?.name || "");
        setBuyers(filters.buyers || []);
        setLastSyncedAt(filters.lastSyncedAt || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;
    fetchReconciliationFilters(startDate, endDate)
      .then((filters) => {
        setCampaigns(filters.campaigns || []);
        setLastSyncedAt(filters.lastSyncedAt || null);
        setCampaignName((prev) => {
          if (filters.campaigns?.length && !filters.campaigns.some((c) => c.name === prev)) {
            return filters.defaultCampaign?.name || filters.campaigns[0].name;
          }
          return prev;
        });
      })
      .catch(() => {});
  }, [startDate, endDate]);

  useEffect(() => {
    if (!campaignName || !startDate || !endDate) return;
    fetchReconciliationBuyers(campaignName, startDate, endDate)
      .then((result) => {
        const nextBuyers = result.buyers || [];
        setBuyers(nextBuyers);
        setBuyerName((prev) => {
          if (!nextBuyers.some((b) => b.name === prev)) {
            return nextBuyers[0]?.name || "";
          }
          return prev;
        });
      })
      .catch(() => setBuyers([]));
  }, [campaignName, startDate, endDate]);

  useEffect(() => {
    if (!campaignName || !startDate || !endDate) return;
    setLoading(true);
    fetchReconciliation({ campaignName, buyerName, startDate, endDate })
      .then(setData)
      .catch(() => setData({ summary: {}, calls: [] }))
      .finally(() => setLoading(false));
  }, [campaignName, buyerName, startDate, endDate]);

  const summary = data.summary || {};

  const summaryRows = useMemo(
    () => [
      {
        campaign: summary.campaign || campaignName,
        buyer: summary.buyer || buyerName,
        calls: summary.calls || 0,
        convertedCalls: summary.convertedCalls || 0,
        rpc: summary.rpc || 0,
        revenue: summary.revenue || 0,
        payout: summary.payout || 0,
        profit: summary.profit || 0,
      },
    ],
    [summary, campaignName, buyerName]
  );

  /** Shift the current From/To window by N days (keeps span length). */
  const shiftDateRange = (days) => {
    if (!startDate || !endDate) return;
    setStartDate(shiftIsoDate(startDate, days));
    setEndDate(shiftIsoDate(endDate, days));
  };

  const handleDownload = () => {
    if (!buyerName || !(data.calls || []).length) return;
    downloadSoldCallsCsv({
      buyerName,
      startDate,
      endDate,
      calls: data.calls,
    });
  };

  return (
    <div>
      <h3>Reconciliation</h3>
      <p className="subtle">
        {dataSource === "mongodb"
          ? `Review sold calls by campaign and buyer for the selected date range. Data is filtered to your From/To dates.${
              lastSyncedAt
                ? ` Last synced ${new Date(lastSyncedAt).toLocaleString("en-US", { timeZone: "America/New_York" })} ET.`
                : ""
            }`
          : "Review sold calls by campaign and buyer for the selected date range. Data loads live from Ringba."}
      </p>

      {dataSource === "mongodb" && !loading && campaigns.length === 0 ? (
        <p className="subtle">
          No campaign data found for {formatDateRange(startDate, endDate)}. Adjust the date range or wait for the next
          sync.
        </p>
      ) : null}

      <div className="card filter-panel">
        <div className="filter-grid">
          <label>
            Campaign
            <select value={campaignName} onChange={(e) => setCampaignName(e.target.value)}>
              {campaigns.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Buyer
            <select value={buyerName} onChange={(e) => setBuyerName(e.target.value)}>
              {buyers.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
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

      <div className="filter-chips">
        <FilterChip label="Campaign" value={campaignName} />
        <FilterChip label="Buyer" value={buyerName} />
        <FilterChip label="Range" value={formatDateRange(startDate, endDate)} />
      </div>

      {loading ? <p className="subtle">Loading reconciliation data...</p> : null}

      <div className="card">
        <h3>Summary</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Buyer</th>
                <th>Inc</th>
                <th>Converted</th>
                <th>RPC</th>
                <th>Revenue</th>
                <th>Payout</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={`${row.campaign}-${row.buyer}`}>
                  <td>{row.campaign}</td>
                  <td>{row.buyer}</td>
                  <td>{row.calls}</td>
                  <td>{row.convertedCalls}</td>
                  <td>{formatCurrency(row.rpc)}</td>
                  <td>{formatCurrency(row.revenue)}</td>
                  <td>{formatCurrency(row.payout)}</td>
                  <td>{formatCurrency(row.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h3>Sold Calls ({data.soldCallCount || 0})</h3>
            <p className="subtle">Calls within {formatDateRange(startDate, endDate)} only.</p>
          </div>
          <div className="row-actions">
            <button
              type="button"
              className="btn btn-inline btn-small btn-week-nav"
              onClick={() => shiftDateRange(-7)}
              disabled={loading || !startDate || !endDate}
              title="Shift range back 7 days"
              aria-label="Previous period"
            >
              ←
            </button>
            <button
              type="button"
              className="btn btn-inline btn-small btn-week-nav"
              onClick={() => shiftDateRange(7)}
              disabled={loading || !startDate || !endDate}
              title="Shift range forward 7 days"
              aria-label="Next period"
            >
              →
            </button>
            <button
              type="button"
              className="btn btn-inline"
              onClick={handleDownload}
              disabled={loading || !(data.calls || []).length}
            >
              Download
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Call Date</th>
                <th>Caller ID</th>
                <th>Target</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data.calls || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="subtle">
                    No sold calls found for this date range.
                  </td>
                </tr>
              ) : (
                data.calls.map((call) => (
                  <tr key={`${call.callDtRaw}-${call.inboundPhoneNumber}-${call.conversionAmount}`}>
                    <td>{call.callDt}</td>
                    <td>{call.inboundPhoneNumber}</td>
                    <td>{call.targetName}</td>
                    <td>{formatCurrency(call.conversionAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
