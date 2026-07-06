# DigitalOcean Deployment — NLM Portal

Repo: https://github.com/miguel-truenorthmedia/NLM-PORTAL.git

---

## Part 1 — Push code from your PC (one time)

Open terminal in `NLM-Dashboard` folder:

```powershell
cd C:\Users\19mig\OneDrive\Desktop\NLM-Dashboard

git init
git add .
git commit -m "Initial NLM Portal — dashboard, MongoDB sync, deployment config"

git branch -M main
git remote add origin https://github.com/miguel-truenorthmedia/NLM-PORTAL.git
git push -u origin main
```

If the GitHub repo already has commits, use:

```powershell
git pull origin main --allow-unrelated-histories
# resolve conflicts if any, then:
git push -u origin main
```

> `.env` files are gitignored — secrets stay on the server only.

---

## Part 2 — First-time server setup (SSH into droplet)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# 3. Install PM2
sudo npm install -g pm2

# 4. Clone repo
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/miguel-truenorthmedia/NLM-PORTAL.git nlm-portal
cd nlm-portal
```

### Backend environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Set these (copy from your local `backend/.env`):

```env
PORT=4000
USE_MONGODB=true
MONGODB_URI=mongodb+srv://miguel_db_user:PASSWORD@nlm.macyon3.mongodb.net/nlm-dashboard?retryWrites=true&w=majority&appName=NLM
RINGBA_ACCOUNT_ID=...
RINGBA_API_TOKEN=...
```

### MongoDB Atlas — whitelist droplet IP

In Atlas → **Database & Network Access** → **Network Access** → add your **droplet public IP**.

### Frontend build env

```bash
cp frontend/.env.production.example frontend/.env.production
```

`VITE_API_BASE_URL=/api` works when nginx proxies `/api` to the backend on the same server.

### Install, sync data, start

```bash
cd /var/www/nlm-portal/backend
npm install
npm run sync:all

cd /var/www/nlm-portal
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# run the command pm2 startup prints (sudo env PATH=...)
```

### Build frontend

```bash
cd /var/www/nlm-portal/frontend
npm install
npm run build
```

### Nginx

```bash
sudo nano /etc/nginx/sites-available/nlm-portal
```

Paste:

```nginx
server {
    listen 80;
    server_name _;   # replace with your domain later e.g. portal.northernleadsmedia.com

    root /var/www/nlm-portal/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -sf /etc/nginx/sites-available/nlm-portal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Part 3 — Test

From the droplet:

```bash
curl http://127.0.0.1:4000/api/health
curl http://127.0.0.1/api/health
```

From your browser:

```
http://YOUR_DROPLET_IP/
```

Expect: Home page, Campaign Performance, Reconciliation with MongoDB data.

---

## Part 4 — Future updates (manual)

SSH to server:

```bash
cd /var/www/nlm-portal
bash scripts/deploy.sh
```

Or locally after pushing to GitHub:

```powershell
git add .
git commit -m "your message"
git push origin main
```

Then on server: `bash scripts/deploy.sh`

---

## Part 5 — Automatic deploy on git push (GitHub Actions)

Already in repo: `.github/workflows/deploy.yml`

### One-time GitHub setup

1. On droplet, create deploy key or use existing SSH key
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
3. Add secrets:

| Secret | Value |
|--------|-------|
| `DO_HOST` | Droplet IP |
| `DO_USER` | `root` or your sudo user |
| `DO_SSH_KEY` | Private SSH key (full PEM) |
| `DO_APP_DIR` | `/var/www/nlm-portal` (optional) |

4. On droplet, add the matching **public** key to `~/.ssh/authorized_keys` if using a new deploy key

After that, every `git push` to `main` runs `scripts/deploy.sh` on the server automatically.

---

## Part 6 — Combined domain (marketing site + portal at /admin)

Marketing site lives in `website/`. Portal is at `/admin` on the same domain.

### DNS

Point both records to your droplet IP (`67.205.180.116`):

| Type | Name | Value |
|------|------|-------|
| A | `@` | `67.205.180.116` |
| A | `www` | `67.205.180.116` |

### One-time nginx (replaces the IP-only `nlm-portal` site)

```bash
sudo cp /var/www/nlm-portal/nginx/northernleadsmedia.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/northernleadsmedia.com.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/nlm-portal /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d northernleadsmedia.com -d www.northernleadsmedia.com
```

### Deploy (builds website + portal)

```bash
cd /var/www/nlm-portal
bash scripts/deploy.sh
```

This publishes:

- `website/dist/` → `/var/www/northernleadsmedia.com/`
- `frontend/dist/` → `/var/www/northernleadsmedia.com/admin/`

### URLs

| URL | App |
|-----|-----|
| `https://www.northernleadsmedia.com/` | Company website |
| `https://www.northernleadsmedia.com/admin` | NLM Portal |
| `https://www.northernleadsmedia.com/api/health` | API health check |

---

| Step | Done |
|------|------|
| Code pushed to GitHub | ☐ |
| Node 20 + nginx + pm2 on droplet | ☐ |
| Repo cloned to `/var/www/nlm-portal` | ☐ |
| `backend/.env` configured | ☐ |
| Droplet IP in MongoDB Atlas | ☐ |
| `npm run sync:all` | ☐ |
| PM2 running `nlm-api` | ☐ |
| Frontend built | ☐ |
| Nginx configured | ☐ |
| Browser test passes | ☐ |
| GitHub Actions secrets (optional) | ☐ |
