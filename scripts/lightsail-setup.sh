#!/usr/bin/env bash
set -euo pipefail

# ===========================================
# Lightsail Instance Setup for SBB Medicare
# ===========================================
#
# Run this script on a fresh Ubuntu Lightsail instance.
#
# Prerequisites:
#   - Ubuntu 22.04+ Lightsail instance (minimum 1GB RAM)
#   - SSH access to the instance
#   - Port 80 opened in Lightsail firewall (Networking tab)
#
# Usage:
#   ssh ubuntu@<lightsail-ip> 'bash -s' < scripts/lightsail-setup.sh
#   OR
#   scp scripts/lightsail-setup.sh ubuntu@<lightsail-ip>:~ && ssh ubuntu@<lightsail-ip> ./lightsail-setup.sh

echo "=== SBB Medicare: Lightsail Setup ==="
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
  # Install Docker using official convenience script
  curl -fsSL https://get.docker.com | sudo sh

  # Add current user to docker group (avoids needing sudo)
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

# --- Step 4: Install pg_dump (for migration) ---
echo ""
echo "Step 4: Installing PostgreSQL client (for migration)..."
sudo apt-get install -y postgresql-client

# --- Step 5: Install Node.js (for frontend builds) ---
echo ""
echo "Step 5: Installing Node.js 18..."

if command -v node &>/dev/null; then
  echo "  Node.js already installed: $(node --version)"
else
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  echo "  Node.js installed: $(node --version)"
fi

# --- Step 6: Clone repository ---
echo ""
echo "Step 6: Repository setup..."

REPO_DIR="$HOME/sbb-medicare"

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
echo "  1. Clone/pull the repo:  cd $REPO_DIR"
echo "  2. Create env file:      cp .env.production.template .env.production"
echo "  3. Edit env file:        nano .env.production"
echo "  4. Deploy:               ./deploy.sh"
echo "  5. Migrate data:         ./scripts/migrate-from-render.sh <RENDER_DB_URL>"
echo ""
echo "IMPORTANT: Open port 80 in your Lightsail instance:"
echo "  Lightsail Console → Instance → Networking → Add rule → HTTP (80)"
echo ""
echo "NOTE: You may need to log out and back in for Docker group permissions"
echo "to take effect (or run: newgrp docker)"
