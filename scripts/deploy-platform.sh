#!/usr/bin/env bash
set -euo pipefail

# =============================================
# PharmaPay — Platform Deployment
# =============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== PharmaPay: Deploy ==="
echo ""

# --- Pre-flight checks ---
if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker is not installed."
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo "ERROR: Docker Compose plugin is not installed."
  exit 1
fi

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found."
  echo "  cp .env.production.template .env.production"
  exit 1
fi

# --- Step 1: Pull latest code ---
echo "Step 1: Pulling latest code..."
git pull origin main
echo ""

# --- Step 2: Run pending migrations ---
echo "Step 2: Running pending migrations..."

source .env.production

MIGRATION_DIR="platform/database/migrations"
MIGRATION_TRACKING_TABLE="schema_migrations"

# Create tracking table if it doesn't exist
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
  CREATE TABLE IF NOT EXISTS $MIGRATION_TRACKING_TABLE (
    filename VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
  );
" 2>/dev/null

# Run each migration file in order if not already applied
if [ -d "$MIGRATION_DIR" ]; then
  for migration in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
    filename=$(basename "$migration")

    already_applied=$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
      SELECT COUNT(*) FROM $MIGRATION_TRACKING_TABLE WHERE filename = '$filename';
    " 2>/dev/null | tr -d ' ')

    if [ "$already_applied" = "1" ]; then
      echo "  Skip: $filename (already applied)"
      continue
    fi

    echo "  Applying: $filename ..."
    docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$migration"

    docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
      INSERT INTO $MIGRATION_TRACKING_TABLE (filename) VALUES ('$filename');
    "

    echo "  Done: $filename"
  done
else
  echo "  No migrations directory found."
fi
echo ""

# --- Step 3: Build containers ---
echo "Step 3: Building containers..."
docker compose build --no-cache
echo ""

# --- Step 4: Start services ---
echo "Step 4: Starting services..."
docker compose up -d
echo ""

# --- Step 5: Reload nginx ---
echo "Step 5: Reloading nginx config..."
docker exec pharmapay-nginx nginx -s reload 2>/dev/null || echo "  (nginx container not named pharmapay-nginx, skipping reload)"
echo ""

# --- Step 6: Status ---
echo "Step 6: Service status"
docker compose ps
echo ""

echo "=== Deploy complete ==="
