# API Reference

Base URL: `http://localhost:4000/api`

## Health

### `GET /health`

```json
{
  "ok": true,
  "dataSource": "ringba",
  "useMongoDb": false
}
```

---

## Campaign Performance

### `GET /campaign/filters`

Returns campaigns, ad accounts, offer types, and traffic sources.

### `GET /campaign/traffic-sources`

Returns configured traffic sources (BIGO, Facebook, Google).

### `GET /campaign/daily`

Query params: `startDate`, `endDate`, optional `offerType`, `campaignId`, `adAccountId`

Returns summary KPIs + daily rows (Ringba metrics merged with ad spend).

Daily rows include `adSpend` (total) and `spendBySource` (per-source breakdown).

### `POST /campaign/spend`

Save or update manual ad spend for a date + ad account + traffic source.

**Body:**

```json
{
  "date": "2026-07-03",
  "adAccountId": "franz-fe-1",
  "amount": 237.94,
  "trafficSourceId": "bigo"
}
```

`trafficSourceId` is optional — defaults from the ad account. Legacy field `bigoSpend` is still accepted.

**Response:**

```json
{
  "ok": true,
  "row": {
    "date": "2026-07-03",
    "adAccountId": "franz-fe-1",
    "trafficSourceId": "bigo",
    "amount": 237.94,
    "campaign": "Franz - FE - 1",
    "source": "manual"
  }
}
```

### `GET /campaign/ad-accounts`

List ad accounts from `adAccounts.json`.

### `GET /campaign/ringba/campaigns`

List Ringba campaigns.

### `GET /campaign/ringba/campaigns/:campaignId`

Campaign detail including media buyers.

---

## Reconciliation

### `GET /reconciliation/last-week`

Returns default date range for last business week.

### `GET /reconciliation/filters`

Query: optional `startDate`, `endDate`

Returns campaigns, buyers, defaults, `dataSource`, and `lastSyncedAt` (Mongo only).

### `GET /reconciliation/buyers`

Query: `campaignName`, `startDate`, `endDate`

### `GET /reconciliation`

Query: `campaignName`, `startDate`, `endDate`, optional `buyerName`

Returns summary + sold calls.

**Sold call fields:** `callDt`, `callerId` (`inboundPhoneNumber`), `targetName`, `conversionAmount`

### `GET /reconciliation/weeks`

Lists synced weeks (Mongo only; empty array when Mongo disabled).

### `POST /reconciliation/sync`

Triggers manual sync of last week's data (Mongo only).

---

## Response: reconciliation data

```json
{
  "dateRange": { "startDate": "2026-06-28", "endDate": "2026-07-03" },
  "summary": {
    "campaign": "NLM - Final Expense",
    "buyer": "Elijay Marketing",
    "calls": 120,
    "convertedCalls": 17,
    "rpc": 12.5,
    "revenue": 1500,
    "payout": 800,
    "profit": 700,
    "convertedPercent": 14.17
  },
  "calls": [],
  "totalCallLogs": 120,
  "soldCallCount": 17,
  "dataSource": "ringba"
}
```
