#!/usr/bin/env bash
# Run on the DigitalOcean droplet after git pull
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/nlm-portal}"
WEB_ROOT="${WEB_ROOT:-/var/www/northernleadsmedia.com}"

cd "$APP_DIR"

echo "==> Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "==> Installing backend dependencies..."
cd backend
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "==> Building marketing website..."
cd ../website
npm ci 2>/dev/null || npm install
npm run build

echo "==> Building NLM portal ( /admin )..."
cd ../frontend
cp .env.production.example .env.production
npm ci 2>/dev/null || npm install
npm run build

echo "==> Publishing static files to ${WEB_ROOT}..."
mkdir -p "$WEB_ROOT/admin"
rsync -a --delete --exclude 'admin/' "$APP_DIR/website/dist/" "$WEB_ROOT/"
rsync -a --delete "$APP_DIR/frontend/dist/" "$WEB_ROOT/admin/"

echo "==> Restarting API..."
cd "$APP_DIR"
pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
pm2 save

if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx
fi

echo "==> Deploy complete"
curl -sf http://127.0.0.1:4000/api/health && echo "" || echo "Warning: API health check failed"
