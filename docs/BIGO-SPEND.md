# BIGO Spend

BIGO is one **traffic source** (`trafficSourceId: "bigo"`). It does not expose a public spend API, so spend is entered manually.

See [TRAFFIC-SOURCES.md](TRAFFIC-SOURCES.md) for the full multi-source architecture (Facebook and Google via API later).

## How it works

1. **Ringba** provides calls, conversions, and revenue per ad account.
2. **BIGO spend** is entered per ad account per day (manual).
3. **Campaign Performance** merges total **Ad Spend** with Ringba data for profit, ROI, RPC, and cost per call.

```text
Ringba insights (daily)  +  campaignDaily.json (amount per source)  →  profit / ROI
```

## Adding spend in the UI

1. Go to **Campaign Performance** (`/campaigns`)
2. Click **Add Ad Spend** (only shown for manual traffic sources like BIGO)
3. Select date, ad account, and amount
4. Save

Traffic source is inherited from the ad account (`trafficSourceId: "bigo"` on Franz - FE - 1).

If an entry already exists for that date + ad account + source, it is **updated**.

## Data file

**Path:** `backend/data/campaignDaily.json`

```json
{
  "date": "2026-07-03",
  "adAccountId": "franz-fe-1",
  "trafficSourceId": "bigo",
  "amount": 237.94,
  "campaign": "Franz - FE - 1",
  "source": "manual"
}
```

## Ad account setup

Franz - FE - 1 in `adAccounts.json`:

```json
{
  "id": "franz-fe-1",
  "trafficSourceId": "bigo",
  ...
}
```

## API

`POST /api/campaign/spend` — see [API.md](API.md)

Accepts `amount` (or legacy `bigoSpend`). Traffic source defaults from the ad account.

## Metrics

| Metric | Formula |
|--------|---------|
| Profit | Revenue − Ad Spend |
| ROI | (Profit / Ad Spend) × 100 |
| RPC | Revenue / Converted Calls |
| Cost per Call | Ad Spend / Calls |

Divide-by-zero returns `0`.
