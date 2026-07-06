# NLM Dashboard

Internal KPI portal for **NorthernLeads Media**. Tracks campaign performance (Ringba + BIGO spend), weekly buyer reconciliation, and sold-call exports for media buyer reporting.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express (`:4000`) |
| Frontend | React, Vite (`:5173`) |
| Call data | [Ringba API v2](https://api.ringba.com) |
| BIGO spend | Manual entry → `backend/data/campaignDaily.json` |
| Reconciliation cache | MongoDB (optional, off by default) |

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Home overview |
| `/campaigns` | Campaign Performance — daily KPIs, BIGO spend entry |
| `/reconciliation` | Weekly buyer reconciliation + CSV download |

## Quick start (local)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set in `backend/.env`:

```env
RINGBA_ACCOUNT_ID=your_account_id
RINGBA_API_TOKEN=your_token
USE_MONGODB=false
```

```bash
npm run dev
```

Backend: http://localhost:4000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

Optional `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

> There is **no root `package.json`**. Run backend and frontend in separate terminals.

## Documentation

| Doc | Contents |
|-----|----------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, file layout |
| [Local development](docs/LOCAL-DEVELOPMENT.md) | Env vars, running, troubleshooting |
| [API reference](docs/API.md) | All endpoints |
| [BIGO spend](docs/BIGO-SPEND.md) | Manual spend entry and data file |
| [BIGO email sync](docs/BIGO-EMAIL-SYNC.md) | Auto-import spend from BIGO daily emails |
| [Traffic sources](docs/TRAFFIC-SOURCES.md) | BIGO / FB / Google spend architecture |
| [Reconciliation](docs/RECONCILIATION.md) | Weekly buyer reports, CSV export |
| [MongoDB](docs/MONGODB.md) | Optional cache + Monday sync job |
| [Deployment](docs/DEPLOYMENT.md) | Server deploy checklist (general) |
| [DigitalOcean deploy](docs/DIGITALOCEAN-DEPLOY.md) | Step-by-step DO droplet setup + auto-deploy |
| [Auth roadmap](docs/AUTH-ROADMAP.md) | Planned login + media buyer scoping |
| [Roadmap](docs/ROADMAP.md) | Upcoming work (MongoDB, deploy, auth, email, QuickBooks, buyers page) |

## Tomorrow's checklist

1. **MongoDB** — Create cluster, set `USE_MONGODB=true` + `MONGODB_URI`, run first sync
2. **Deploy** — See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
3. **Auth** — See [docs/AUTH-ROADMAP.md](docs/AUTH-ROADMAP.md)
4. **Buyers page** — Requirements TBD; see [docs/ROADMAP.md](docs/ROADMAP.md#6-buyers-page)

## Current data modes

| Feature | Default (local) | With MongoDB |
|---------|-----------------|--------------|
| Campaign Performance | Ringba live + JSON spend | Same |
| Reconciliation | Ringba live | Cached snapshots, Monday 1 AM ET sync |

MongoDB is **disabled by default** so you can keep developing locally without a database.

## Project structure

```text
NLM-Dashboard/
  backend/
    data/
      adAccounts.json       # Ad account → Ringba tag + traffic source
      trafficSources.json   # BIGO, Facebook, Google config
      campaignDaily.json    # Ad spend by date/account/source
    src/
      routes/               # Express routes
      services/             # Business logic + Ringba client
      models/               # Mongoose models (reconciliation)
      jobs/                 # Cron: Monday reconciliation sync
      db/                   # Mongo connection
    scripts/
      sync-reconciliation.mjs
  frontend/
    src/
      pages/                # Home, Campaigns, Reconciliation
      components/
      services/api.js       # API client
  docs/                     # Detailed documentation
```

## License

Internal use — NorthernLeads Media.
