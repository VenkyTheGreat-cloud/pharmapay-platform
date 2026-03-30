#!/usr/bin/env bash
set -euo pipefail

# ===========================================
# Lightsail Instance Setup for PharmaPay
# ===========================================
#
# Run this script on a fresh Ubuntu Lightsail instance.
#
# Prerequisites:
#   - Ubuntu 22.04+ Lightsail instance (minimum 2GB RAM)
#   - SSH access to the instance
#   - Ports 80 and 443 opened in Lightsail firewall
#
# Usage:
#   ssh ubuntu@15.207.142.166 'bash -s' < scripts/lightsail-setup.sh

echo "=== PharmaPay: Lightsail Setup ==="
echo ""

# --- Step 1: System updates ---
echo "Step 1: Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# --- Step 2: Install Docker ---
echo ""
echo "Step 2: Installing Docker..."

if command -v docker &>/dev/null; then
  echo "  Docker already installed: $(docker --version)"
else
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  echo "  Docker installed: $(docker --version)"
fi

# --- Step 3: Install Docker Compose plugin ---
echo ""
echo "Step 3: Checking Docker Compose..."

if docker compose version &>/dev/null; then
  echo "  Docker Compose already available: $(docker compose version --short)"
else
  sudo apt-get install -y docker-compose-plugin
  echo "  Docker Compose installed: $(docker compose version --short)"
fi

# --- Step 4: Install AWS CLI (for Route53 SSL) ---
echo ""
echo "Step 4: Installing AWS CLI..."

if command -v aws &>/dev/null; then
  echo "  AWS CLI already installed: $(aws --version)"
else
  sudo apt-get install -y awscli
  echo "  AWS CLI installed"
fi

# --- Step 5: Clone repository ---
echo ""
echo "Step 5: Repository setup..."

REPO_DIR="/opt/pharmapay"

if [ -d "$REPO_DIR" ]; then
  echo "  Repository already exists at $REPO_DIR"
  echo "  Pull latest changes with: cd $REPO_DIR && git pull"
else
  echo "  Clone your repository:"
  echo "    git clone <YOUR_REPO_URL> $REPO_DIR"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Clone/pull the repo:     cd $REPO_DIR"
echo "  2. Create root .env:        (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)"
echo "  3. Create platform env:     cp .env.production.template platform/.env.production"
echo "  4. Configure AWS CLI:       aws configure (for Route53 SSL)"
echo "  5. Setup SSL:               sudo ./scripts/setup-ssl.sh"
echo "  6. Deploy:                  ./deploy.sh"
echo ""
echo "DNS records required (Route53):"
echo "  A  pharmapay.swinkpay-fintech.com    → 15.207.142.166"
echo "  A  *.pharmapay.swinkpay-fintech.com  → 15.207.142.166"
echo ""
echo "Lightsail firewall:"
echo "  Open ports 80 (HTTP) and 443 (HTTPS)"
echo ""
echo "NOTE: Log out and back in for Docker group permissions"
echo "  (or run: newgrp docker)"
