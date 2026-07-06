# Local Development

## Prerequisites

- Node.js 18+ (20+ recommended for latest mongoose)
- Ringba API credentials
- MongoDB optional (off by default)

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | API port |
| `RINGBA_ACCOUNT_ID` | Yes | — | Ringba account ID |
| `RINGBA_API_TOKEN` | Yes | — | Ringba API token |
| `USE_MONGODB` | No | `false` | Enable MongoDB reconciliation cache |
| `MONGODB_URI` | If Mongo | — | MongoDB connection string |
| `GOOGLE_SHEETS_*` | No | — | Legacy KPI flow only (unused) |

Copy from example:

```bash
cd backend
cp .env.example .env
```

### Frontend (`frontend/.env`)

| Variable | Required | Default |
|----------|----------|---------|
| `VITE_API_BASE_URL` | No | `http://localhost:4000/api` |

Ringba credentials in `frontend/.env` are **not used** — only the backend reads them.

## Running locally

**Terminal 1 — backend:**

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Verify backend

```bash
curl http://localhost:4000/api/health
```

Response when MongoDB is off:

```json
{ "ok": true, "dataSource": "ringba", "useMongoDb": false }
```

## Test scripts

```bash
cd backend
node scripts/test-ringba.mjs
node scripts/test-reconciliation.mjs
node scripts/test-calllogs-pagination.mjs
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend won't start (Mongo error) | Set `USE_MONGODB=false` or add valid `MONGODB_URI` |
| Ringba 401 | Use `Token` auth; check `RINGBA_API_TOKEN` |
| Reconciliation shows fewer sold calls than converted | Fixed via call log pagination — ensure latest code |
| Date range off by one day | Uses local dates; check `dateRange.js` |
| `npm run dev` at repo root fails | No root package.json — run backend and frontend separately |
| Campaign table empty | Check Ringba credentials and ad account filters |

## Adding ad accounts

Edit `backend/data/adAccounts.json`:

```json
{
  "id": "unique-id",
  "displayName": "Franz - FE - 1",
  "ringbaAccountTag": "Franz--NLM-FE-1",
  "campaignId": "CAf073c253e2244171ac7c49a892f85299",
  "offerType": "FE",
  "trafficSourceId": "bigo"
}
```

- `ringbaAccountTag` must match the Ringba `tag:User:account` value
- `trafficSourceId` links to `backend/data/trafficSources.json` (`bigo`, `facebook`, or `google`)

See [TRAFFIC-SOURCES.md](TRAFFIC-SOURCES.md).
