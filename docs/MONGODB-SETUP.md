# MongoDB Setup Guide

Your Atlas cluster is named **NLM**. Follow these steps to connect the portal.

## Step 1 — Finish Atlas wizard (your screenshot)

1. Click **Create Database User** (username: `miguel_db_user`)
2. Click **Choose a connection method**
3. Select **Drivers** → **Node.js**
4. Copy the connection string. It looks like:

```
mongodb+srv://miguel_db_user:<password>@nlm.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Replace `<password>` with your database password
6. Add database name before `?`: `/nlm-dashboard`

**Final URI example:**

```
mongodb+srv://miguel_db_user:YOUR_PASSWORD@nlm.xxxxx.mongodb.net/nlm-dashboard?retryWrites=true&w=majority
```

> If your password has special characters (`@`, `#`, etc.), [URL-encode](https://www.urlencoder.org/) it.

## Step 2 — Backend `.env`

Edit `backend/.env`:

```env
USE_MONGODB=true
MONGODB_URI=mongodb+srv://miguel_db_user:YOUR_PASSWORD@YOUR_CLUSTER_HOST/nlm-dashboard?retryWrites=true&w=majority
```

Keep your existing `RINGBA_*` variables.

## Step 3 — Test connection

```bash
cd backend
npm run test:mongo
```

You should see: `MongoDB connection OK`

## Step 4 — First data sync (pulls from Ringba → saves to MongoDB)

```bash
cd backend
npm run sync:all
```

This syncs:
- **Campaign data** — last 60 days per ad account
- **Reconciliation** — last 8 weeks per campaign × buyer

Takes a few minutes (Ringba API calls).

## Step 5 — Restart backend

```bash
npm run dev
```

You should see:

```
MongoDB enabled — portal reads from database (Ringba sync on schedule)
```

## Step 6 — Verify portal

- `http://localhost:4000/api/health` → `"dataSource": "mongodb"`
- **Home**, **Campaign Performance**, **Reconciliation** load from MongoDB (fast)
- Manual **BIGO spend** still works — merged on read from `campaignDaily.json`

---

## What is stored in MongoDB

| Collection | Contents |
|------------|----------|
| `campaigndailyrows` | Daily Ringba metrics per ad account |
| `reconciliationsnapshots` | Weekly buyer reconciliation + sold calls |
| `reconciliationruns` | Sync job logs |
| `cachedmetadatas` | Campaign list for filters |

## Automatic sync schedule

| Job | When | What |
|-----|------|------|
| Reconciliation | Monday 1:00 AM ET | Last week's buyer data |
| Campaign | Daily 2:00 AM ET | Last 60 days per ad account |

## Manual re-sync anytime

```bash
npm run sync:all
```

Or:

```bash
curl -X POST http://localhost:4000/api/sync/all
```

## IP whitelist

Your IP `49.149.173.58` is already added in Atlas. When you deploy to a server, add that server's IP too.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MongoDB connection failed` | Check URI, password encoding, IP whitelist |
| Empty pages after enabling Mongo | Run `npm run sync:all` first |
| Data looks stale | Re-run `npm run sync:all` |
| Still slow | Confirm `/api/health` shows `mongodb` |

## Turn off MongoDB (back to live Ringba)

```env
USE_MONGODB=false
```

Restart backend.
