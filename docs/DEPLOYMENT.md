# Deployment

Checklist for putting NLM Dashboard on a server.

## Prerequisites

- Linux VPS or cloud VM (Ubuntu 22.04+ recommended)
- Node.js 20 LTS
- MongoDB Atlas cluster (or managed MongoDB)
- Domain + SSL (optional but recommended)
- Ringba API credentials

## 1. Server setup

```bash
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repo
git clone <your-repo-url> nlm-dashboard
cd nlm-dashboard
```

## 2. Backend

```bash
cd backend
npm install --production
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=4000
USE_MONGODB=true
MONGODB_URI=mongodb+srv://...
RINGBA_ACCOUNT_ID=...
RINGBA_API_TOKEN=...
```

Run first reconciliation sync:

```bash
npm run sync:reconciliation
```

### Process manager (PM2)

```bash
sudo npm install -g pm2
pm2 start src/server.js --name nlm-api --cwd /path/to/nlm-dashboard/backend
pm2 save
pm2 startup
```

## 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Build and serve:

```bash
npm run build
```

Serve `frontend/dist` with nginx, Caddy, or static hosting.

### Example nginx

```nginx
server {
  listen 80;
  server_name dashboard.yourdomain.com;

  root /var/www/nlm-dashboard/frontend/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

Alternatively, proxy only the API subdomain and point `VITE_API_BASE_URL` there.

## 4. Environment checklist

| Item | Done |
|------|------|
| `RINGBA_*` credentials set | ☐ |
| `USE_MONGODB=true` | ☐ |
| `MONGODB_URI` set + IP whitelisted | ☐ |
| First reconciliation sync run | ☐ |
| PM2 or systemd for backend | ☐ |
| Frontend built with correct API URL | ☐ |
| HTTPS enabled | ☐ |
| Firewall: only 80/443 public | ☐ |

## 5. Data persistence

These files must persist on the server (or move to Mongo later):

- `backend/data/campaignDaily.json` — BIGO spend
- `backend/data/adAccounts.json` — ad account config

Back up `data/` regularly or migrate to MongoDB.

## 6. Post-deploy verification

```bash
curl https://api.yourdomain.com/api/health
curl "https://api.yourdomain.com/api/reconciliation/filters"
```

Open dashboard in browser:

- Campaign Performance loads with Ringba data
- Reconciliation loads from MongoDB (fast)
- CSV download works

## 7. Updates

```bash
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart nlm-api
```

## Security notes (before auth)

- Do not expose backend without authentication long-term
- Keep `.env` out of git
- Restrict MongoDB network access to server IP
- See [AUTH-ROADMAP.md](AUTH-ROADMAP.md) for login plans
