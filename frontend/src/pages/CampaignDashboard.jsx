import { useEffect, useMemo, useState } from "react";
import KpiCards from "../components/KpiCards.jsx";
import CampaignTable from "../components/CampaignTable.jsx";
import { fetchCampaignDaily, fetchFilterOptions, saveAdSpend } from "../services/api.js";
import { getYesterdayDate } from "../utils/dateHelpers.js";

const DEFAULT_START = "2026-06-28";
const DEFAULT_END = getYesterdayDate();
const DEFAULT_CAMPAIGN = "CAf073c253e2244171ac7c49a892f85299";
const DEFAULT_AD_ACCOUNT = "franz-fe-1";

function getTrafficSourceLabel(trafficSources, id) {
  return trafficSources.find((source) => source.id === id)?.label || id || "Unknown";
}

export default function CampaignDashboard() {
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [offerType, setOfferType] = useState("FE");
  const [campaignId, setCampaignId] = useState(DEFAULT_CAMPAIGN);
  const [adAccountId, setAdAccountId] = useState(DEFAULT_AD_ACCOUNT);
  const [filterOptions, setFilterOptions] = useState({
    campaigns: [],
    adAccounts: [],
    offerTypes: [],
    trafficSources: [],
  });
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [loading, setLoading] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [savingSpend, setSavingSpend] = useState(false);
  const [spendError, setSpendError] = useState("");
  const [spendDate, setSpendDate] = useState(DEFAULT_END);
  const [spendAdAccountId, setSpendAdAccountId] = useState(DEFAULT_AD_ACCOUNT);
  const [spendAmount, setSpendAmount] = useState("");

  const loadCampaignData = () => {
    setLoading(true);
    return fetchCampaignDaily(startDate, endDate, { offerType, campaignId, adAccountId })
      .then(setData)
      .catch(() => setData({ summary: {}, rows: [] }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFilterOptions()
      .then(setFilterOptions)
      .catch(() => setFilterOptions({ campaigns: [], adAccounts: [], offerTypes: [], trafficSources: [] }));
  }, []);

  const campaignsForOffer = useMemo(
    () => filterOptions.campaigns.filter((item) => !offerType || item.offerType === offerType),
    [filterOptions.campaigns, offerType]
  );

  const adAccountsForCampaign = useMemo(
    () => filterOptions.adAccounts.filter((item) => !campaignId || item.campaignId === campaignId),
    [filterOptions.adAccounts, campaignId]
  );

  const manualAdAccounts = useMemo(() => {
    const manualSourceIds = new Set(
      (filterOptions.trafficSources || [])
        .filter((source) => source.spendMethod === "manual")
        .map((source) => source.id)
    );
    return adAccountsForCampaign.filter((account) => manualSourceIds.has(account.trafficSourceId));
  }, [adAccountsForCampaign, filterOptions.trafficSources]);

  const selectedSpendAccount = useMemo(
    () => adAccountsForCampaign.find((account) => account.id === spendAdAccountId) || null,
    [adAccountsForCampaign, spendAdAccountId]
  );

  const selectedSpendSourceLabel = useMemo(
    () => getTrafficSourceLabel(filterOptions.trafficSources, selectedSpendAccount?.trafficSourceId),
    [filterOptions.trafficSources, selectedSpendAccount]
  );

  useEffect(() => {
    loadCampaignData();
  }, [startDate, endDate, offerType, campaignId, adAccountId]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Spend", value: data.summary.totalSpend, type: "currency" },
      { label: "Total Revenue", value: data.summary.totalRevenue, type: "currency" },
      { label: "Total Profit", value: data.summary.totalProfit, type: "currency" },
      { label: "AVG ROI", value: data.summary.avgRoi, type: "percent" },
      { label: "AVG Converted %", value: data.summary.avgConvertedPercent, type: "percent" },
      {
        label: "Period Converted %",
        value: data.summary.periodConvertedPercent ?? data.summary.avgConvertedPercent,
        type: "percent",
      },
    ],
    [data.summary]
  );

  const openSpendModal = () => {
    setSpendError("");
    setSpendAmount("");
    setSpendDate(endDate);
    setSpendAdAccountId(adAccountId || manualAdAccounts[0]?.id || "");
    setShowSpendModal(true);
  };

  const closeSpendModal = () => {
    setShowSpendModal(false);
    setSpendError("");
  };

  const submitSpend = async (event) => {
    event.preventDefault();
    const parsedSpend = Number(spendAmount);
    if (!spendAdAccountId) {
      setSpendError("Please select an ad account.");
      return;
    }
    if (!Number.isFinite(parsedSpend) || parsedSpend < 0) {
      setSpendError("Please enter a valid spend amount.");
      return;
    }

    try {
      setSavingSpend(true);
      setSpendError("");
      await saveAdSpend({
        date: spendDate,
        adAccountId: spendAdAccountId,
        amount: parsedSpend,
      });
      await loadCampaignData();
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
        <div>
          <h2>Campaign Performance</h2>
          <p className="subtle">
            Ringba supplies calls and revenue. Ad spend comes from each ad account&apos;s traffic source (BIGO manual today; FB/Google via API later).
          </p>
        </div>
        <button
          type="button"
          className="btn btn-inline"
          onClick={openSpendModal}
          disabled={manualAdAccounts.length === 0}
        >
          Add Ad Spend
        </button>
      </div>

      <div className="card filter-panel">
        <div className="filter-grid">
          <label>
            Offer
            <select value={offerType} onChange={(e) => setOfferType(e.target.value)}>
              <option value="">All Offers</option>
              {filterOptions.offerTypes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Campaign
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">All Campaigns</option>
              {campaignsForOffer.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ad Account
            <select value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)}>
              <option value="">All Ad Accounts</option>
              {adAccountsForCampaign.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.displayName}
                  {option.trafficSourceId
                    ? ` (${getTrafficSourceLabel(filterOptions.trafficSources, option.trafficSourceId)})`
                    : ""}
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

      {loading ? <p className="subtle">Loading...</p> : null}
      <KpiCards items={summaryCards} />
      <CampaignTable rows={data.rows} />

      {showSpendModal ? (
        <div className="modal-backdrop" role="presentation" onClick={closeSpendModal}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Add Ad Spend</h3>
            <p className="subtle">
              Manual entry for traffic sources without an API. Existing entries for the same date and source are updated.
            </p>
            <form onSubmit={submitSpend} className="spend-form">
              <label>
                Date
                <input type="date" value={spendDate} onChange={(e) => setSpendDate(e.target.value)} required />
              </label>
              <label>
                Ad Account
                <select value={spendAdAccountId} onChange={(e) => setSpendAdAccountId(e.target.value)} required>
                  {manualAdAccounts.length === 0 ? <option value="">No manual ad accounts available</option> : null}
                  {manualAdAccounts.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Traffic Source
                <input type="text" value={selectedSpendSourceLabel} readOnly />
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
                <button type="submit" className="btn btn-inline" disabled={savingSpend || manualAdAccounts.length === 0}>
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
