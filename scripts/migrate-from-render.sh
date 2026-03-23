#!/usr/bin/env bash
set -euo pipefail

# ===========================================
# Migrate SBB Medicare from Render to Lightsail
# ===========================================
#
# Prerequisites:
#   1. Docker services running (run deploy.sh first)
#   2. Render external database URL (from Render dashboard → PostgreSQL → External URL)
#
# Usage:
#   ./scripts/migrate-from-render.sh <RENDER_DATABASE_URL>
#
# Example:
#   ./scripts/migrate-from-render.sh "postgresql://user:pass@host/dbname"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

DUMP_FILE="render_backup.dump"

# --- Validate arguments ---
if [ $# -lt 1 ]; then
  echo "Usage: $0 <RENDER_EXTERNAL_DATABASE_URL>"
  echo ""
  echo "Find your Render database URL at:"
  echo "  Render Dashboard → PostgreSQL → Info → External Database URL"
  exit 1
fi

RENDER_DB_URL="$1"

# --- Check Docker is running ---
if ! docker compose ps --status running | grep -q postgres; then
  echo "ERROR: PostgreSQL container is not running."
  echo "Start services first: ./deploy.sh"
  exit 1
fi

# --- Load local DB credentials ---
if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found."
  exit 1
fi

source .env.production

echo "=== SBB Medicare: Render → Lightsail Migration ==="
echo ""

# --- Step 1: Dump from Render ---
echo "Step 1: Dumping Render database..."
echo "  This may take a few minutes depending on database size."
pg_dump "$RENDER_DB_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --verbose \
  -f "$DUMP_FILE" 2>&1 | tail -5

echo "  Dump saved to $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
echo ""

# --- Step 2: Restore into Lightsail Docker PostgreSQL ---
echo "Step 2: Restoring into Lightsail PostgreSQL..."
echo "  WARNING: This will overwrite existing data in the local database."
read -p "  Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Drop and recreate the database to start clean
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" 2>/dev/null || true

docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c \
  "DROP DATABASE IF EXISTS $POSTGRES_DB;"

docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c \
  "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;"

# Restore the dump
docker compose exec -T postgres pg_restore \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-privileges \
  --verbose \
  < "$DUMP_FILE" 2>&1 | tail -10

echo ""

# --- Step 3: Verify migration ---
echo "Step 3: Verifying migration..."
echo ""

TABLES=("users" "customers" "orders" "order_items" "payments" "delivery_boys")

echo "  Table row counts:"
for table in "${TABLES[@]}"; do
  count=$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
    "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "N/A")
  printf "    %-20s %s\n" "$table" "$count"
done

echo ""
echo "=== Database migration complete ==="
echo ""
echo "Next steps:"
echo "  1. Verify the counts above match your Render database"
echo "  2. Migrate uploads (see below)"
echo "  3. Restart the backend: docker compose restart backend"
echo ""
echo "--- Migrating uploads ---"
echo "If you have files in Render's /opt/render/project/src/uploads/,"
echo "download them and copy into the Docker uploads volume:"
echo ""
echo "  # From your local machine (with Render CLI or SSH):"
echo "  scp -r render-uploads/* ."
echo ""
echo "  # Copy into the running uploads volume:"
echo "  docker compose cp ./uploads/. backend:/app/uploads/"
echo ""
echo "  # Or if you have the files locally already:"
echo "  docker cp ./uploads/. \$(docker compose ps -q backend):/app/uploads/"
echo ""

# Clean up dump file
read -p "Delete dump file ($DUMP_FILE)? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -f "$DUMP_FILE"
  echo "Dump file deleted."
fi
