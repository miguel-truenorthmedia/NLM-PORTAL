# NLM Dashboard Roadmap

Planned work for the coming days and weeks.

## Priority queue

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **MongoDB setup** | Done | Connected to Atlas **NLM**; `sync:all` populates campaign + reconciliation. See [MONGODB-SETUP.md](MONGODB-SETUP.md), [DATA-STRATEGY.md](DATA-STRATEGY.md) |
| 2 | **Deploy to server** | Planned | VPS, PM2, nginx, SSL. See [DEPLOYMENT.md](DEPLOYMENT.md) |
| 3 | **Auth & users** | Planned | Login, roles, media buyers see only their data. See [AUTH-ROADMAP.md](AUTH-ROADMAP.md) |
| 4 | **Reconciliation auto-email** | Planned | Weekly sold-call reports emailed to buyers from accounting email |
| 5 | **Accounting page + QuickBooks** | Exploring | Full sold-call invoices (not just 1-week window), QuickBooks integration |
| 6 | **Buyers page** | Planned | Dedicated buyer view — fields/columns TBD with team |
| 7 | **BIGO email spend sync** | Deferred | Auto-import from `noreply@service.bigoads.com` — parser built; Gmail OAuth later. **Using manual entry for now.** See [BIGO-EMAIL-SYNC.md](BIGO-EMAIL-SYNC.md) |

## 1. MongoDB

- [ ] Create MongoDB Atlas cluster (or self-hosted)
- [ ] Set `MONGODB_URI` and `USE_MONGODB=true` in production `.env`
- [ ] Run initial sync: `npm run sync:reconciliation`
- [ ] Verify Monday 1:00 AM ET cron on server
- [ ] Optional: migrate ad spend from JSON to Mongo

**Why:** Reconciliation loads fast without hitting Ringba on every page view.

## 2. Server deployment

- [ ] Choose host (VPS / cloud)
- [ ] Node 20, PM2 for backend
- [ ] Build frontend with production API URL
- [ ] nginx + HTTPS
- [ ] Backup `backend/data/` (ad accounts, spend)
- [ ] Env vars secured (Ringba, MongoDB)

See [DEPLOYMENT.md](DEPLOYMENT.md).

## 3. Auth & user access

- [ ] User model in MongoDB
- [ ] Login / logout (session or JWT)
- [ ] Protect all `/api/*` routes
- [ ] **Admin** — full access
- [ ] **Media buyer** — scoped to their ad account(s) and buyer name(s) only
- [ ] Login page in React

See [AUTH-ROADMAP.md](AUTH-ROADMAP.md).

## 4. Reconciliation auto-sending

Weekly buyer reports (currently manual CSV download).

- [ ] Email template: buyer name + sold calls table/CSV attachment
- [ ] Send from **accounting email** (SMTP or SendGrid/SES)
- [ ] Schedule: after Monday reconciliation sync (e.g. Monday morning)
- [ ] Per-buyer recipient list config
- [ ] Optional: preview / approve before send
- [ ] Log sent reports (date, buyer, status)

**Builds on:** MongoDB snapshots + existing CSV export format.

## 5. Accounting page + QuickBooks

**Different from reconciliation:** not limited to a 1-week window — all sold calls for invoicing.

- [ ] Define accounting workflow (TBD with team)
- [ ] Accounting page UI: buyer, date range, all sold calls
- [ ] QuickBooks API integration (OAuth, invoice creation)
- [ ] Attach or line-item sold calls on invoice
- [ ] Sync status / error handling

**Open questions:**

- Invoice per buyer per week vs per call batch?
- Which QuickBooks products (Online vs Desktop)?
- Map Ringba buyers → QuickBooks customers?

## 6. Buyers page

Dedicated page for media buyers (separate from Reconciliation’s weekly sold-call view).

- [ ] Define required data / columns (TBD — pending product input)
- [ ] New route (e.g. `/buyers`) + nav link
- [ ] Backend API for buyer-level metrics (source TBD: Ringba live vs Mongo)
- [ ] Filters: buyer, campaign, date range
- [ ] Tie-in with auth so media buyers only see their own row(s)

**Status:** Placeholder on roadmap until requirements are confirmed.

**Related:** Reconciliation (weekly sold calls), auto-email (#4), auth scoping (#3).

## 7. BIGO email spend sync (deferred)

**Current approach:** Manual **Add Ad Spend** on Campaign Performance.

Bigo sends daily spend emails the next morning. Parser + Gmail sync code exists but is **not wired up** until you configure accounting Gmail.

- [ ] Google Cloud Gmail API + OAuth refresh token
- [ ] Set `BIGO_EMAIL_GMAIL_*` in `.env`
- [ ] Test `npm run sync:bigo-email`
- [ ] Daily cron (~11 AM ET after emails arrive)

See [BIGO-EMAIL-SYNC.md](BIGO-EMAIL-SYNC.md).

---

## Done recently

- [x] Campaign Performance (Ringba + ad spend)
- [x] Reconciliation + CSV download
- [x] BIGO manual spend entry
- [x] Traffic source architecture (BIGO / FB / Google)
- [x] MongoDB layer — campaign + reconciliation cached; daily/weekly sync jobs
- [x] Documentation (`docs/`)
- [x] Home page 7-day performance chart

## Future (not scheduled)

- Facebook / Google Ads spend API sync
- UI to manage ad accounts (no JSON editing)
- Daily Ringba sync for campaign data (reduce live API load)
- Per-source spend breakdown in tables
