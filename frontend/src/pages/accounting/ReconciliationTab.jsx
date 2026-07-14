import { useEffect, useMemo, useState } from "react";
import { fetchReconciliation, fetchReconciliationBuyers, fetchReconciliationFilters } from "../../services/api.js";
import { formatCurrency, formatDateRange } from "../../components/formatters.js";
import { downloadSoldCallsCsv } from "../../utils/csvExport.js";

function FilterChip({ label, value }) {
  return (
    <span className="filter-chip">
      <strong>{label}:</strong> {value}
    </span>
  );
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
        setCampaigns(filters.campaigns || []);
        setStartDate(filters.defaultRange?.startDate || "");
        setEndDate(filters.defaultRange?.endDate || "");
        setCampaignName(filters.defaultCampaign?.name || "");
        setBuyerName(filters.defaultBuyer?.name || "");
        setBuyers(filters.buyers || []);
        setLastSyncedAt(filters.lastSyncedAt || null);
        setDataSource(filters.dataSource || "ringba");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!campaignName || !startDate || !endDate) return;
    fetchReconciliationBuyers(campaignName, startDate, endDate)
      .then((result) => {
        const nextBuyers = result.buyers || [];
        setBuyers(nextBuyers);
        if (!nextBuyers.some((b) => b.name === buyerName)) {
          setBuyerName(nextBuyers[0]?.name || "");
        }
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
          ? `Review sold calls by campaign and buyer for the selected week. Data syncs from Ringba every Monday at 1:00 AM ET.${
              lastSyncedAt
                ? ` Last synced ${new Date(lastSyncedAt).toLocaleString("en-US", { timeZone: "America/New_York" })} ET.`
                : ""
            }`
          : "Review sold calls by campaign and buyer for the selected week. Data loads live from Ringba."}
      </p>

      {dataSource === "mongodb" && !loading && campaigns.length === 0 ? (
        <p className="subtle">
          No synced reconciliation data for this week yet. Run the backend sync job or wait for Monday&apos;s scheduled
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
            <p className="subtle">Only calls with conversion amount are shown.</p>
          </div>
          <button
            type="button"
            className="btn btn-inline"
            onClick={handleDownload}
            disabled={loading || !(data.calls || []).length}
          >
            Download
          </button>
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
                    No sold calls found for this filter.
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
