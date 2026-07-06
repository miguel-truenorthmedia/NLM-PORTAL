import { useEffect, useMemo, useState } from "react";
import DateRangeSelector from "../components/DateRangeSelector.jsx";
import KpiCards from "../components/KpiCards.jsx";
import ChartsSection from "../components/ChartsSection.jsx";
import AdGroupTable from "../components/AdGroupTable.jsx";
import { createManualSpend, fetchDailyKpi } from "../services/api.js";

const MOCK_DAILY_DATA = {
  summary: {
    spend: 624.67,
    revenue: 223.86,
    profit: -400.81,
    roas: 0.36,
    calls: 5,
    connectedCalls: 4,
    paidCalls: 3,
  },
  byAdGroup: [
    {
      campaign: "NLM FE EN",
      publisher: "Inbound Calls",
      adGroup: "AG006",
      spend: 435.35,
      calls: 2,
      connectedCalls: 2,
      paidCalls: 2,
      revenue: 190.65,
      cpa: 217.68,
      rpc: 95.33,
      roas: 0.44,
      profit: -244.7,
      margin: -1.28,
      avgDuration: 171.5,
    },
    {
      campaign: "NLM FE EN",
      publisher: "Inbound Calls",
      adGroup: "AG007",
      spend: 166.72,
      calls: 2,
      connectedCalls: 2,
      paidCalls: 1,
      revenue: 33.21,
      cpa: 166.72,
      rpc: 16.61,
      roas: 0.2,
      profit: -133.51,
      margin: -4.02,
      avgDuration: 108,
    },
    {
      campaign: "Unknown",
      publisher: "Unknown",
      adGroup: "Unknown",
      spend: 22.6,
      calls: 1,
      connectedCalls: 0,
      paidCalls: 0,
      revenue: 0,
      cpa: 0,
      rpc: 0,
      roas: 0,
      profit: -22.6,
      margin: 0,
      avgDuration: 25,
    },
  ],
  byDay: [
    { date: "2026-05-07", spend: 390.92, revenue: 121.46, profit: -269.46 },
    { date: "2026-05-08", spend: 233.75, revenue: 102.4, profit: -131.35 },
  ],
};

function dateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function getRangeForPreset(preset) {
  const now = new Date();
  const today = dateOnly(now);
  if (preset === "today") return { startDate: today, endDate: today };
  if (preset === "yesterday") {
    const y = dateOnly(addDays(now, -1));
    return { startDate: y, endDate: y };
  }
  if (preset === "last7") return { startDate: dateOnly(addDays(now, -6)), endDate: today };
  if (preset === "last30") return { startDate: dateOnly(addDays(now, -29)), endDate: today };
  return { startDate: today, endDate: today };
}

export default function DailyKpiPage() {
  const initialRange = getRangeForPreset("today");
  const [preset, setPreset] = useState("today");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [data, setData] = useState({
    summary: { spend: 0, revenue: 0, profit: 0, roas: 0, calls: 0, connectedCalls: 0, paidCalls: 0 },
    byAdGroup: [],
    byDay: [],
  });
  const [loading, setLoading] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [publisherFilter, setPublisherFilter] = useState("");
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [savingSpend, setSavingSpend] = useState(false);
  const [spendError, setSpendError] = useState("");
  const [spendAdGroup, setSpendAdGroup] = useState("");
  const [spendAmount, setSpendAmount] = useState("");

  const loadDailyData = () => {
    setLoading(true);
    return fetchDailyKpi(startDate, endDate, { campaign: campaignFilter, publisher: publisherFilter })
      .then((response) => setData(response))
      .catch(() => setData(MOCK_DAILY_DATA))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDailyData();
  }, [startDate, endDate, campaignFilter, publisherFilter]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Spend", value: data.summary.spend, type: "currency" },
      { label: "Total Revenue", value: data.summary.revenue, type: "currency" },
      { label: "Total Profit", value: data.summary.profit, type: "currency" },
      { label: "ROAS", value: data.summary.roas, type: "roas" },
      { label: "Total Calls", value: data.summary.calls, type: "text" },
      { label: "Paid Calls", value: data.summary.paidCalls, type: "text" },
    ],
    [data.summary]
  );

  const onPresetChange = (nextPreset) => {
    setPreset(nextPreset);
    if (nextPreset !== "custom") {
      const range = getRangeForPreset(nextPreset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  const onDateChange = (field, value) => {
    setPreset("custom");
    if (field === "startDate") setStartDate(value);
    if (field === "endDate") setEndDate(value);
  };

  const adGroupRows = useMemo(() => data.byAdGroup.filter((item) => item.adGroup), [data.byAdGroup]);
  const adGroupOptions = useMemo(() => adGroupRows.map((item) => item.adGroup), [adGroupRows]);
  const campaignOptions = useMemo(
    () => [...new Set(data.byAdGroup.map((item) => item.campaign).filter(Boolean))],
    [data.byAdGroup]
  );
  const publisherOptions = useMemo(
    () => [...new Set(data.byAdGroup.map((item) => item.publisher).filter(Boolean))],
    [data.byAdGroup]
  );

  const openSpendModal = () => {
    setSpendError("");
    setSpendAmount("");
    setSpendAdGroup(adGroupOptions[0] || "");
    setShowSpendModal(true);
  };

  const closeSpendModal = () => {
    setShowSpendModal(false);
    setSpendError("");
  };

  const submitSpend = async (event) => {
    event.preventDefault();
    const parsedSpend = Number(spendAmount);
    if (!spendAdGroup) {
      setSpendError("Please select an ad group.");
      return;
    }
    if (!Number.isFinite(parsedSpend) || parsedSpend < 0) {
      setSpendError("Please enter a valid spend amount.");
      return;
    }

    try {
      setSavingSpend(true);
      setSpendError("");
      await createManualSpend({
        date: endDate,
        campaign: adGroupRows.find((row) => row.adGroup === spendAdGroup)?.campaign || "Unknown",
        publisher: adGroupRows.find((row) => row.adGroup === spendAdGroup)?.publisher || "Unknown",
        adGroup: spendAdGroup,
        spend: parsedSpend,
      });
      await loadDailyData();
      closeSpendModal();
    } catch {
      setSpendError("Failed to save ad spend. Please try again.");
    } finally {
      setSavingSpend(false);
    }
  };

  return (
    <section>
      <div className="section-head">
        <h2>Daily KPI</h2>
        <button type="button" className="btn btn-inline" onClick={openSpendModal}>
          Add Ad Spend
        </button>
      </div>
      <DateRangeSelector
        preset={preset}
        startDate={startDate}
        endDate={endDate}
        onPresetChange={onPresetChange}
        onDateChange={onDateChange}
      />
      <div className="card filter-row">
        <label>
          Campaign
          <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)}>
            <option value="">All Campaigns</option>
            {campaignOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Publisher
          <select value={publisherFilter} onChange={(e) => setPublisherFilter(e.target.value)}>
            <option value="">All Publishers</option>
            {publisherOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? <p className="subtle">Loading KPI data...</p> : null}
      <KpiCards items={summaryCards} />
      <ChartsSection byDay={data.byDay} byAdGroup={data.byAdGroup} />
      <AdGroupTable rows={data.byAdGroup} />

      {showSpendModal ? (
        <div className="modal-backdrop" role="presentation" onClick={closeSpendModal}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Add Ad Spend</h3>
            <p className="subtle">Entry date uses selected end date: {endDate}</p>
            <form onSubmit={submitSpend} className="spend-form">
              <label>
                Ad Group
                <select value={spendAdGroup} onChange={(e) => setSpendAdGroup(e.target.value)} required>
                  {adGroupOptions.length === 0 ? <option value="">No ad groups available</option> : null}
                  {adGroupOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ad Spend
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  required
                />
              </label>
              {spendError ? <p className="error-text">{spendError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="preset" onClick={closeSpendModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-inline" disabled={savingSpend || adGroupOptions.length === 0}>
                  {savingSpend ? "Saving..." : "Save Spend"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
