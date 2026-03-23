#!/usr/bin/env bash
set -euo pipefail

# ===========================================
# SSL Setup for SBB Medicare Subdomains
# ===========================================
#
# Prerequisites:
#   - DNS A records pointing to this server:
#     PharmaA.swinkpay-fintech.com → 13.205.170.117
#     PharmaS.swinkpay-fintech.com → 13.205.170.117
#   - Port 80 open (for Let's Encrypt verification)
#   - Port 443 open in Lightsail firewall
#
# Usage:
#   sudo ./scripts/setup-ssl.sh

echo "=== SBB Medicare: SSL Setup ==="

# Install certbot
echo "Step 1: Installing certbot..."
if command -v certbot &>/dev/null; then
  echo "  certbot already installed"
else
  apt-get update -y
  apt-get install -y certbot
fi

# Stop nginx temporarily for standalone verification
echo ""
echo "Step 2: Obtaining SSL certificates..."
echo "  Stopping nginx for certificate verification..."

cd /home/ubuntu/sbb-medicare
docker compose stop nginx

# Get certificates
certbot certonly --standalone \
  -d PharmaA.swinkpay-fintech.com \
  -d PharmaS.swinkpay-fintech.com \
  --non-interactive \
  --agree-tos \
  --email admin@swinkpay-fintech.com

echo ""
echo "Step 3: Restarting nginx..."
docker compose start nginx

echo ""
echo "=== SSL certificates obtained ==="
echo ""
echo "Certificates are at:"
echo "  /etc/letsencrypt/live/PharmaA.swinkpay-fintech.com/"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose.yml to mount cert volumes"
echo "  2. Update nginx.conf with SSL server blocks"
echo "  3. Open port 443 in Lightsail firewall"
echo "  4. Restart: docker compose restart nginx"
echo ""
echo "Auto-renewal is set up via certbot systemd timer."
echo "  Test with: certbot renew --dry-run"
