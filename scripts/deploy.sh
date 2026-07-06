#!/usr/bin/env bash
# Run on the DigitalOcean droplet after git pull
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/nlm-portal}"
cd "$APP_DIR"

echo "==> Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "==> Installing backend dependencies..."
cd backend
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "==> Installing frontend dependencies & building..."
cd ../frontend
npm ci 2>/dev/null || npm install
npm run build

echo "==> Restarting API..."
cd ..
pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
pm2 save

echo "==> Deploy complete"
curl -sf http://127.0.0.1:4000/api/health && echo "" || echo "Warning: health check failed"
