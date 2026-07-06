# MongoDB Setup

MongoDB is **optional**. It caches reconciliation snapshots so the frontend does not hit Ringba on every page load.

**Default:** `USE_MONGODB=false` — reconciliation reads live from Ringba.

## When to enable

Enable when deploying to a server or when reconciliation loads become too slow.

Campaign Performance still uses live Ringba + JSON spend (Mongo not required for campaigns yet).

## Setup steps

### 1. Create a MongoDB cluster

- [MongoDB Atlas](https://www.mongodb.com/atlas) (recommended) or self-hosted
- Create a database user and whitelist your server IP (or `0.0.0.0/0` for dev)

### 2. Configure backend

In `backend/.env`:

```env
USE_MONGODB=true
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/nlm-dashboard
```

### 3. Restart backend

```bash
cd backend
npm run dev
```

You should see: `MongoDB enabled — reconciliation reads from database`

### 4. Run first sync

Populate last week's data immediately (don't wait for Monday):

```bash
cd backend
npm run sync:reconciliation
```

Or:

```bash
curl -X POST http://localhost:4000/api/reconciliation/sync
```

### 5. Verify

- `GET /api/health` → `"dataSource": "mongodb"`
- Reconciliation page shows campaigns/buyers and `Last synced ... ET`

## Scheduled sync

**When:** Every Monday at **1:00 AM Eastern Time**

**What:** Pulls last week's reconciliation for every campaign × buyer from Ringba and upserts to MongoDB.

**Code:** `backend/src/jobs/reconciliationSyncJob.js`

Cron: `0 1 * * 1` with timezone `America/New_York`

## Collections

| Collection | Purpose |
|------------|---------|
| `reconciliationsnapshots` | Weekly campaign + buyer data and sold calls |
| `reconciliationruns` | Sync job audit log (status, errors, duration) |

## Disable MongoDB (back to local mode)

```env
USE_MONGODB=false
```

Restart backend. Reconciliation returns to live Ringba reads.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend fails to start | Check `MONGODB_URI`, network access, credentials |
| Empty reconciliation page | Run `npm run sync:reconciliation` |
| Stale data | Re-run sync or wait for Monday job |
| Sync errors in logs | Check Ringba credentials; see `reconciliationruns` collection |

## Future

- Store campaign BIGO spend in MongoDB
- Daily 1 AM EST sync for campaign performance (reduce Ringba load for long date ranges)
