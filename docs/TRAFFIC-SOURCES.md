# Traffic Sources

Ad spend can come from multiple traffic sources. Each **ad account** is linked to one source. Total **Ad Spend** on Campaign Performance is the sum across all sources for that account and date.

## Current sources

| ID | Label | Spend method | Status |
|----|-------|--------------|--------|
| `bigo` | BIGO | Manual | Active — use **Add Ad Spend** in UI |
| `facebook` | Facebook | API | Planned |
| `google` | Google Ads | API | Planned |

Config: `backend/data/trafficSources.json`

## Ad account mapping

Each ad account in `backend/data/adAccounts.json` has a `trafficSourceId`:

```json
{
  "id": "franz-fe-1",
  "displayName": "Franz - FE - 1",
  "ringbaAccountTag": "Franz--NLM-FE-1",
  "campaignId": "CAf073c253e2244171ac7c49a892f85299",
  "offerType": "FE",
  "trafficSourceId": "bigo"
}
```

When you add FB or Google ad accounts, set `trafficSourceId` to `facebook` or `google`.

## Spend storage

**File:** `backend/data/campaignDaily.json`

**Schema (one row per date + ad account + traffic source):**

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

| Field | Description |
|-------|-------------|
| `source` | `manual` (UI entry) or `api` (future sync) |
| `amount` | Spend in dollars for that source on that day |

Legacy rows with `bigoSpend` are still read correctly.

## Manual vs API sources

### Manual (`spendMethod: "manual"`)

- BIGO today — no public spend API
- Entered via **Add Ad Spend** on Campaign Performance
- `POST /api/campaign/spend`

### API (`spendMethod: "api"`)

- Facebook and Google — spend pulled from their APIs
- **Not implemented yet** — provider stubs exist
- Manual entry is blocked for API sources (backend returns an error)

## Provider registry

**Code:** `backend/src/services/spendProviders/index.js`

```text
trafficSources.json  →  spendProviders  →  campaignDaily.json
                              ↑
                    future: daily sync job
```

Planned providers:

| Provider key | Traffic source | Env vars (future) |
|--------------|----------------|-------------------|
| `facebook-ads` | facebook | `FACEBOOK_ADS_*` |
| `google-ads` | google | `GOOGLE_ADS_*` |

Each provider will implement:

```javascript
fetchDailySpend({ adAccount, startDate, endDate, trafficSource })
// → [{ date, amount }]
```

Synced rows are saved with `source: "api"`.

## API response shape

Campaign daily rows now use **`adSpend`** (total) instead of `bigoSpend`:

```json
{
  "date": "2026-07-03",
  "adSpend": 237.94,
  "spendBySource": { "bigo": 237.94 },
  "revenue": 333.99,
  "profit": 96.05
}
```

`spendBySource` is ready for multi-source breakdown in the UI later.

## Adding a new FB/Google ad account (when ready)

1. Add ad account to `adAccounts.json` with `trafficSourceId: "facebook"` or `"google"`
2. Implement the provider in `spendProviders/`
3. Add API credentials to `backend/.env`
4. Add a daily sync job (same pattern as reconciliation Monday sync)
5. Campaign Performance will show combined **Ad Spend** automatically

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/campaign/traffic-sources` | List all traffic sources |
| POST | `/api/campaign/spend` | Manual spend entry (`amount`, optional `trafficSourceId`) |

## Future UI ideas

- Per-source spend columns in the table
- Traffic source filter on Campaign Performance
- Sync status / last API pull per source
