#!/usr/bin/env bash
set -euo pipefail

# ===========================================
# SSL Setup — Wildcard cert for PharmaGig
# ===========================================
#
# Prerequisites:
#   - AWS CLI configured with Route53 permissions:
#     route53:ListHostedZones, route53:GetChange, route53:ChangeResourceRecordSets
#   - DNS wildcard A record: *.pharmagig.swinkpay-fintech.com → 15.207.142.166
#   - DNS A record: pharmagig.swinkpay-fintech.com → 15.207.142.166
#
# Usage:
#   sudo ./scripts/setup-ssl.sh

DOMAIN="pharmagig.swinkpay-fintech.com"
EMAIL="admin@swinkpay-fintech.com"

echo "=== PharmaGig: Wildcard SSL Setup ==="

# Step 1: Install certbot + Route53 plugin
echo ""
echo "Step 1: Installing certbot and Route53 DNS plugin..."
if command -v certbot &>/dev/null; then
  echo "  certbot already installed"
else
  apt-get update -y
  apt-get install -y certbot
fi

# Install Route53 plugin
if pip3 show certbot-dns-route53 &>/dev/null 2>&1; then
  echo "  certbot-dns-route53 already installed"
else
  apt-get install -y python3-pip
  pip3 install certbot-dns-route53
fi

# Step 2: Stop nginx temporarily
echo ""
echo "Step 2: Stopping nginx for certificate verification..."
cd /opt/pharmapay
docker compose stop platform-nginx 2>/dev/null || true

# Step 3: Obtain wildcard certificate via DNS challenge
echo ""
echo "Step 3: Obtaining wildcard SSL certificate..."
echo "  Domains: ${DOMAIN}, *.${DOMAIN}"
echo "  Method:  Route53 DNS-01 challenge"

certbot certonly \
  --dns-route53 \
  -d "${DOMAIN}" \
  -d "*.${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}"

# Step 4: Restart nginx
echo ""
echo "Step 4: Restarting nginx..."
docker compose start platform-nginx

echo ""
echo "=== Wildcard SSL certificate obtained ==="
echo ""
echo "Certificate covers:"
echo "  ${DOMAIN}"
echo "  *.${DOMAIN} (all tenant subdomains)"
echo ""
echo "Certificates at:"
echo "  /etc/letsencrypt/live/${DOMAIN}/"
echo ""
echo "Auto-renewal is handled by certbot systemd timer."
echo "  Test with: sudo certbot renew --dry-run"
echo ""
echo "To reload nginx after renewal, add a deploy hook:"
echo "  certbot renew --deploy-hook 'cd /opt/pharmapay && docker compose exec platform-nginx nginx -s reload'"
