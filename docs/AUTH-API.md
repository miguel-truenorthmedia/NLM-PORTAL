# Authentication API

All protected routes require `Authorization: Bearer <token>` from login.

## Public

### `POST /api/auth/login`

```json
{ "email": "admin@northernleadsmedia.com", "password": "your-password" }
```

Response:

```json
{
  "ok": true,
  "token": "jwt...",
  "user": {
    "_id": "...",
    "email": "admin@northernleadsmedia.com",
    "name": "Admin",
    "role": "admin",
    "adAccountIds": [],
    "buyerNames": [],
    "active": true
  }
}
```

## Authenticated

### `GET /api/auth/me`

Returns the current user profile.

### `POST /api/auth/logout`

Stateless JWT — client should delete the stored token. Endpoint exists for consistency.

## Admin only

### `POST /api/auth/register`

Create a new user (admin must be logged in).

```json
{
  "email": "buyer@example.com",
  "password": "min-8-chars",
  "name": "Media Buyer",
  "role": "media_buyer",
  "adAccountIds": ["franz-fe-1"],
  "buyerNames": ["Elijay Marketing"]
}
```

### `GET /api/users`

List all users.

### `GET /api/users/:id`

Admin or the user themselves.

### `PATCH /api/users/:id`

Update name/password. Admins can also change `role`, `adAccountIds`, `buyerNames`, `active`.

### `DELETE /api/users/:id`

Delete a user (admin cannot delete themselves).

## Protected data APIs

These now require a valid login token:

- `/api/campaign/*`
- `/api/reconciliation/*`
- `/api/sync/*` (admin only)

## First admin user

Set in `backend/.env`:

```env
JWT_SECRET=long-random-string
ADMIN_EMAIL=admin@northernleadsmedia.com
ADMIN_PASSWORD=your-secure-password
```

On first startup (empty `users` collection), the server auto-creates the admin.

Or run manually:

```bash
cd backend
npm run seed:admin
```

## Roles

| Role | Access |
|------|--------|
| `admin` | Full portal + user management |
| `media_buyer` | Portal data (scoping by ad account/buyer — coming next) |
