# What We Store in MongoDB

Decision guide for NLM Dashboard data persistence.

## Principle

**Ringba = source of truth for calls/revenue.**  
**MongoDB = cached snapshots** so the portal loads fast without API calls on every page view.  
**Sync jobs** refresh MongoDB on a schedule (not on every browser refresh).

---

## Currently in MongoDB (live today)

| Collection | What | Used by | Sync |
|------------|------|---------|------|
| `reconciliationsnapshots` | Weekly summary + sold calls per campaign × buyer | Reconciliation page, CSV download | Monday 1 AM ET + `npm run sync:all` |
| `reconciliationruns` | Sync job audit log | Internal / debugging | Auto |
| `campaigndailyrows` | Daily Ringba metrics per ad account (calls, revenue, converted %) | Home, Campaign Performance | Daily 2 AM ET + `npm run sync:all` |
| `cachedmetadatas` | Campaign list for filters | Campaign Performance filters | With campaign sync |

### Reconciliation snapshot fields

- `startDate`, `endDate`, `campaignName`, `buyerName`
- `summary` — calls, converted, RPC, revenue, payout, profit
- `calls[]` — sold call detail (date, caller ID, target, revenue)
- `syncedAt`

### Campaign daily row fields (Ringba only)

- `date`, `campaignId`, `adAccountId`, `offerType`
- `calls`, `convertedCalls`, `convertedPercent`, `revenue`
- **Ad spend is NOT stored in Mongo** — merged from `campaignDaily.json` on read (so manual BIGO entry works instantly)

---

## Still NOT in MongoDB

| Data | Where today | Why |
|------|-------------|-----|
| **BIGO / ad spend** | `backend/data/campaignDaily.json` | Manual entry; small, changes often |
| **Ad accounts config** | `backend/data/adAccounts.json` | Rarely changes; 1 account now |
| **Traffic sources config** | `backend/data/trafficSources.json` | Static config |
| **Ringba campaign detail** | Live API (`/ringba/campaigns/:id`) | Rarely used in UI |
| **Users / auth** | Not built yet | Roadmap #3 |

---

## Recommended: what to save (decision)

### ✅ Keep in MongoDB (already done)

| Data | Recommendation |
|------|----------------|
| Reconciliation weekly snapshots | **Yes** — core buyer reporting |
| Sold call rows | **Yes** — CSV export, future auto-email |
| Campaign daily Ringba metrics | **Yes** — Home + Campaign Performance |
| Campaign list (filters) | **Yes** — avoid Ringba on every filter load |

### ✅ Add to MongoDB (recommended next)

| Data | Priority | Why |
|------|----------|-----|
| **Ad spend (BIGO)** | High | Move off JSON when you deploy; same DB as everything else |
| **Ad accounts** | Medium | UI to add accounts later; no JSON editing on server |
| **Buyer email / contact** | Medium | Needed for reconciliation auto-email (#4) |
| **Users + roles** | High (with auth) | Login, media buyer scoping |

### ⏸ Defer / optional

| Data | Recommendation |
|------|----------------|
| BIGO email raw messages | No — only store parsed spend amounts |
| Every raw Ringba call log forever | No — keep sold calls only for reconciliation; accounting page may need broader range later |
| Google / Facebook spend | When those APIs are wired — same pattern as campaign daily rows |

### ❌ Do not store in MongoDB

| Data | Why |
|------|-----|
| Ringba API tokens | `.env` only |
| Full call recordings / PII beyond what reports need | Minimize storage; only what buyers/accounting need |

---

## Sync schedule (recommended)

| Job | When | What it pulls |
|-----|------|----------------|
| Reconciliation | **Monday 1:00 AM ET** | Last week, all campaigns × buyers |
| Campaign daily | **Daily 2:00 AM ET** | Last 60 days, all ad accounts |
| Full backfill | **On deploy / manual** | `npm run sync:all` (8 weeks reconciliation + 60 days campaign) |

Optional later:

- Reconciliation history sync (12+ weeks) before accounting page
- Retry / backoff when Ringba returns 429 (rate limit)

---

## Open decisions (need your input)

1. **How far back should reconciliation live in Mongo?**  
   - Now: 8 weeks on `sync:all`  
   - Accounting page may need **all sold calls** — separate collection or longer retention?

2. **Move BIGO spend to Mongo now or at deploy?**  
   - Manual entry can write to Mongo instead of JSON when ready.

3. **Campaign sync depth**  
   - Now: per ad account daily rows  
   - Enough for Home (aggregate) + Campaign Performance drill-down?

4. **Buyers page**  
   - What fields? (RPC, revenue, payout, contact — TBD)

---

## Summary

**Today:** Portal reads **reconciliation + campaign metrics** from MongoDB. **Spend** still from JSON file on disk.

**Sweet spot:** Cache everything the **portal displays** from Ringba; keep **config + spend entry** simple until auth and deploy.

**Next logical Mongo additions:** ad spend, ad accounts, buyer contacts, users.
