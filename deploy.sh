#!/bin/bash
# ForgedAds — Hetzner VPS deployment script
# Usage: ./deploy.sh [user@host]

set -euo pipefail

HOST="${1:-root@your-vps-ip}"
APP_DIR="/opt/forgedads"

echo "==> Deploying ForgedAds to $HOST"

# Sync files (exclude dev stuff)
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env.local \
  --exclude nginx/certs \
  ./ "$HOST:$APP_DIR/"

# Build and restart on remote
ssh "$HOST" << 'REMOTE'
cd /opt/forgedads
docker compose build --no-cache
docker compose up -d
docker compose logs -f --tail=20 app
REMOTE

echo "==> Deployed successfully"
