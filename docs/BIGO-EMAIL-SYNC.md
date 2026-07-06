# BIGO Email Spend Sync

BIGO sends a daily spend email **the next morning** (e.g. email on **July 4** contains spend for **July 3**).

**From:** `noreply@service.bigoads.com`

**Table columns:** Account Name · Account ID · Campaign · Country · Time Capped · Spend($)

Example row:

| Account Name | Account ID | Campaign | Spend($) |
|--------------|------------|----------|----------|
| Franz--NLM-FE-1 | 325558 | Franz - FE - 1 | 237.94 |

---

## Can we pull this automatically?

**Yes.** The backend can:

1. Read the inbox that receives BIGO emails (Gmail API)
2. Parse the HTML table
3. Map `Franz--NLM-FE-1` → ad account in `adAccounts.json`
4. Set spend date = **email received date minus 1 day** (America/New_York)
5. Save to `campaignDaily.json` with `source: "email"`

**Code:**

| File | Role |
|------|------|
| `backend/src/services/bigoEmailParser.js` | Parse table + spend date logic |
| `backend/src/services/bigoEmailSpendService.js` | Gmail fetch + upsert spend |
| `backend/scripts/sync-bigo-email.mjs` | Manual sync CLI |
| `backend/scripts/test-bigo-email-parser.mjs` | Parser unit test |

---

## Setup (Gmail — recommended)

The inbox must be the one that receives BIGO reports (your accounting email or a dedicated alias).

### 1. Google Cloud project

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services
2. Enable **Gmail API**
3. Create **OAuth 2.0 Client** (Desktop app or Web)
4. Note **Client ID** and **Client Secret**

### 2. Get a refresh token (one-time)

Use [Google OAuth Playground](https://developers.google.com/oauthplayground/) or a small script:

- Scope: `https://www.googleapis.com/auth/gmail.readonly`
- Authorize the accounting Gmail account
- Exchange code for **refresh token**

### 3. Backend `.env`

```env
BIGO_EMAIL_GMAIL_CLIENT_ID=...
BIGO_EMAIL_GMAIL_CLIENT_SECRET=...
BIGO_EMAIL_GMAIL_REFRESH_TOKEN=...
```

### 4. Run sync

```bash
cd backend
npm run test:bigo-email-parser   # verify parser
npm run sync:bigo-email          # pull recent emails & save spend
```

### 5. Schedule (after deploy)

Daily cron e.g. **11:00 AM ET** (after BIGO emails usually arrive):

```bash
npm run sync:bigo-email
```

Or add to server startup jobs (same pattern as reconciliation Monday sync).

---

## Ad account mapping

`backend/data/adAccounts.json`:

```json
{
  "id": "franz-fe-1",
  "displayName": "Franz - FE - 1",
  "ringbaAccountTag": "Franz--NLM-FE-1",
  "bigoAccountId": "325558",
  "trafficSourceId": "bigo"
}
```

Matching order:

1. `bigoAccountId` (325558)
2. `ringbaAccountTag` (Franz--NLM-FE-1)
3. `displayName` vs email Campaign column

---

## Manual entry vs email

- **Email sync** writes `source: "email"`
- **Add Ad Spend** in the UI still works as a fallback until Gmail is configured
- Once email sync runs, it **upserts** the same date + account (overwrites amount)

---

## Alternative: IMAP

If you don't use Gmail API, IMAP + app password is possible (not built yet). Gmail API is preferred since `googleapis` is already in the project.

---

## Roadmap

- [ ] Connect accounting Gmail (OAuth refresh token)
- [ ] Daily cron for `sync:bigo-email`
- [ ] Optional: mark emails as read / label after sync
- [ ] Admin UI: “Sync BIGO from email” button + last sync time

See also [TRAFFIC-SOURCES.md](TRAFFIC-SOURCES.md) and [ROADMAP.md](ROADMAP.md).
