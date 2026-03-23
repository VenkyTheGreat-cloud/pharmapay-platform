#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== SBB Medicare Deploy ==="

# Pre-flight checks
echo "Running pre-flight checks..."

if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker is not installed. Run scripts/lightsail-setup.sh first."
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo "ERROR: Docker Compose plugin is not installed."
  exit 1
fi

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found."
  echo "Copy the template and fill in your values:"
  echo "  cp .env.production.template .env.production"
  exit 1
fi

# Ensure frontend directories exist
if [ ! -d sbb-medicare-store ]; then
  echo "ERROR: sbb-medicare-store directory not found."
  exit 1
fi

if [ ! -d sbb-medicare-admin ]; then
  echo "ERROR: sbb-medicare-admin directory not found."
  exit 1
fi

# Build store frontend
echo ""
echo "Building store frontend..."
cd sbb-medicare-store
npm install --production=false
VITE_API_URL=/api npm run build
cd "$SCRIPT_DIR"

# Build admin frontend
echo ""
echo "Building admin frontend..."
cd sbb-medicare-admin
npm install --production=false
VITE_API_URL=/api npm run build
cd "$SCRIPT_DIR"

# Start services
echo ""
echo "Starting Docker services..."
docker compose --env-file .env.production up -d --build

# Wait for health check
echo ""
echo "Waiting for services to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost/health >/dev/null 2>&1; then
    echo "Services are healthy!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "WARNING: Health check did not pass within 30 seconds."
    echo "Check logs with: docker compose logs"
    exit 1
  fi
  sleep 1
done

echo ""
echo "=== Deploy complete ==="
echo "Store:  http://localhost/"
echo "Admin:  http://localhost/admin/"
echo "Health: http://localhost/health"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f        # Follow logs"
echo "  docker compose ps             # Check service status"
echo "  docker compose down            # Stop services"
echo "  docker compose restart backend # Restart backend only"
