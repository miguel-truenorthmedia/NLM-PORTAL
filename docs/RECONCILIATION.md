# Reconciliation

Weekly buyer reconciliation for sold calls. Used to review performance and send CSV reports to media buyers.

## Page: `/reconciliation`

### Filters

- **Campaign** — Ringba campaign name (default: NLM - Final Expense)
- **Buyer** — Ringba buyer name (default: Elijay Marketing)
- **Date range** — defaults to last business week via `getLastWeekRange()`

### Tables

**Summary:** Campaign, Buyer, Inc (calls), Converted, RPC, Revenue, Payout, Profit

**Sold Calls:** Call Date, Caller ID, Target, Revenue — only calls with `conversionAmount > 0` or `hasConverted`

### CSV download

Click **Download** in the Sold Calls section.

- Buyer name on first line
- Columns: Call Date, Caller ID, Target, Revenue
- Filename: `{Buyer Name} {startDate}_to_{endDate}.csv`

Example: `Elijay Marketing 2026-06-28_to_2026-07-03.csv`

## Data sources

### Local mode (default)

`USE_MONGODB=false` — data loads **live from Ringba** on each request.

Slower as data grows, but fine for local development.

### Production mode (MongoDB)

`USE_MONGODB=true` — data is **synced weekly** and read from MongoDB.

| When | What |
|------|------|
| Monday 1:00 AM ET | Cron job pulls last week's data from Ringba |
| Any time | Frontend reads from MongoDB (fast) |

Manual sync:

```bash
cd backend
npm run sync:reconciliation
```

Or: `POST /api/reconciliation/sync`

## Ringba API calls (sync only)

- `POST /insights` — grouped by buyer, filtered by campaign + buyer
- `POST /calllogs` — paginated (150/page) for all sold call detail

## Default week range

`getLastWeekRange()` in `backend/src/utils/dateRange.js`:

- End: last Friday
- Start: Sunday before that Monday (6-day window covering Sun–Fri reporting)

Uses local timezone date strings to avoid UTC shift.

## MongoDB schema

Collection: `reconciliationsnapshots`

One document per **week + campaign + buyer**:

```javascript
{
  startDate: "2026-06-28",
  endDate: "2026-07-03",
  campaignId: "CAf...",
  campaignName: "NLM - Final Expense",
  buyerName: "Elijay Marketing",
  summary: { calls, convertedCalls, rpc, revenue, payout, profit, convertedPercent },
  calls: [ /* sold call records */ ],
  totalCallLogs: 120,
  soldCallCount: 17,
  syncedAt: Date
}
```

Unique index: `{ startDate, endDate, campaignName, buyerName }`

See [MONGODB.md](MONGODB.md) for setup.
