# Auth Roadmap

Login and role-based access are **not implemented yet**. This doc captures the planned approach for tomorrow and beyond.

## Goals

1. **Login** — users must authenticate to access the dashboard
2. **Media buyer scoping** — each media buyer sees **only their own data**
3. **Admin access** — NLM team sees everything

## Planned roles

| Role | Access |
|------|--------|
| `admin` | All campaigns, ad accounts, buyers |
| `media_buyer` | Only data linked to their ad account(s) / buyer name(s) |

## Data scoping (media buyer)

A media buyer should only see:

| Page | Scope |
|------|-------|
| Campaign Performance | Their ad account(s) only |
| Reconciliation | Their buyer name(s) only |
| CSV download | Their sold calls only |

### Mapping users → data

Likely fields on user record:

```javascript
{
  email: "buyer@example.com",
  role: "media_buyer",
  adAccountIds: ["franz-fe-1"],
  buyerNames: ["Elijay Marketing"],
  campaignIds: ["CAf073c253e2244171ac7c49a892f85299"]
}
```

Backend middleware filters all queries by the authenticated user's allowed IDs/names.

## Implementation options

### Option A: Session-based (recommended for internal tool)

- `express-session` + secure cookie
- User collection in MongoDB
- Password hash with `bcrypt`
- Login page in React

### Option B: JWT

- Stateless tokens
- Good if frontend and API are on different domains
- Slightly more complex refresh flow

## Suggested build order

1. **User model** in MongoDB (`users` collection)
2. **Auth routes** — `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
3. **Auth middleware** — protect `/api/campaign/*` and `/api/reconciliation/*`
4. **Scope middleware** — filter by `adAccountIds` / `buyerNames` for `media_buyer` role
5. **Login page** — React route `/login`, redirect if unauthenticated
6. **Admin UI** (later) — create users, assign ad accounts

## Frontend changes

- Auth context storing user + role
- Protected routes wrapper
- Hide filters the user cannot change (e.g. media buyer sees only their ad account, pre-selected)
- API client sends session cookie or `Authorization` header

## Security checklist

- [ ] HTTPS only in production
- [ ] HttpOnly secure cookies
- [ ] Rate limit login endpoint
- [ ] Password requirements
- [ ] No Ringba tokens exposed to frontend
- [ ] Backend enforces scoping (never trust frontend filters alone)

## Open questions (decide during implementation)

- One login per media buyer company, or per person?
- Can a media buyer belong to multiple ad accounts?
- Self-service password reset or admin-only?
- SSO (Google) needed?

## Current state

- JWT authentication implemented
- Login page at **`https://www.northernleadsmedia.com/login`**
- Unauthenticated `/admin` visits redirect to `/login`
- Campaign, reconciliation, and sync APIs require auth
- User management APIs for admins (`GET/POST/PATCH/DELETE /api/users`, `POST /api/auth/register`)
- Media buyer data scoping — **not yet implemented** (next step)

See [AUTH-API.md](./AUTH-API.md) for endpoint details.
