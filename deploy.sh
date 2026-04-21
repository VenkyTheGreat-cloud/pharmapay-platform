#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== PharmaPay Deploy ==="

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

if [ ! -f .env ]; then
  echo "ERROR: .env not found (Postgres credentials)."
  echo "Create it with POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB."
  exit 1
fi

if [ ! -f platform/.env.production ]; then
  echo "ERROR: platform/.env.production not found."
  echo "Copy the template and fill in your values:"
  echo "  cp .env.production.template platform/.env.production"
  exit 1
fi

# Pull latest code
echo ""
echo "Pulling latest code..."
git pull origin "$(git branch --show-current)"

# Build and start services
echo ""
echo "Building and starting Docker services..."
docker compose up -d --build

# Restart nginx to pick up any new container IPs
echo ""
echo "Restarting nginx to refresh upstream connections..."
docker compose restart platform-nginx

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
echo ""
echo "Services:"
echo "  Store: https://{slug}.pharmapay.swinkpay-fintech.com"
echo "  Admin: https://{slug}.pharmapay.swinkpay-fintech.com/admin"
echo "  API:   https://{slug}.pharmapay.swinkpay-fintech.com/api"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f              # Follow all logs"
echo "  docker compose logs -f platform-api # Follow API logs"
echo "  docker compose ps                   # Check service status"
echo "  docker compose down                 # Stop services"
echo "  docker compose up -d --build <svc>  # Rebuild one service"
