#!/bin/bash
# ForgedAds — One-time Hetzner VPS setup
# Run this on a fresh Ubuntu 24.04 VPS
# Usage: ssh root@your-vps-ip < setup-vps.sh

set -euo pipefail

echo "==> Updating system"
apt-get update && apt-get upgrade -y

echo "==> Installing Docker"
curl -fsSL https://get.docker.com | sh

echo "==> Installing Certbot"
apt-get install -y certbot

echo "==> Creating app directory"
mkdir -p /opt/forgedads/nginx/certs

echo "==> Setting up firewall"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> VPS ready"
echo ""
echo "Next steps:"
echo "  1. Copy .env.production to /opt/forgedads/"
echo "  2. Get SSL certs: certbot certonly --standalone -d forgedads.ai -d www.forgedads.ai"
echo "  3. Copy certs to /opt/forgedads/nginx/certs/ (fullchain.pem + privkey.pem)"
echo "  4. Run deploy.sh from your local machine"
