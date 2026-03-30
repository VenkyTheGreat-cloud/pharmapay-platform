#!/usr/bin/env bash
set -euo pipefail

# =============================================
# PharmaPay — Provision a new tenant
# =============================================
# Usage: ./scripts/new-tenant.sh <SLUG> <NAME> <PLAN>
# Example: ./scripts/new-tenant.sh acme "Acme Pharmacy" growth

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$REPO_ROOT/tenant-configs/_template.json"
DOMAIN="pharmapay.swinkpay-fintech.com"

# --- Validate arguments ---
if [ $# -lt 3 ]; then
  echo "Usage: $0 <SLUG> <NAME> <PLAN>"
  echo ""
  echo "  SLUG   Lowercase identifier (e.g. acme, medplus)"
  echo "  NAME   Display name (e.g. \"Acme Pharmacy\")"
  echo "  PLAN   Plan tier: starter, growth, or enterprise"
  echo ""
  echo "Example:"
  echo "  $0 acme \"Acme Pharmacy\" growth"
  exit 1
fi

SLUG="$1"
NAME="$2"
PLAN="$3"

SLUG_UPPER=$(echo "$SLUG" | tr '[:lower:]' '[:upper:]')
CONFIG_FILE="$REPO_ROOT/tenant-configs/${SLUG}.json"

# --- Validate slug format ---
if ! echo "$SLUG" | grep -qE '^[a-z][a-z0-9-]{1,58}[a-z0-9]$'; then
  echo "ERROR: SLUG must be lowercase alphanumeric with hyphens, 3-60 chars."
  echo "       Got: $SLUG"
  exit 1
fi

# --- Validate plan ---
if [[ "$PLAN" != "starter" && "$PLAN" != "growth" && "$PLAN" != "enterprise" ]]; then
  echo "ERROR: PLAN must be starter, growth, or enterprise."
  echo "       Got: $PLAN"
  exit 1
fi

# --- Check for duplicates ---
if [ -f "$CONFIG_FILE" ]; then
  echo "ERROR: Tenant config already exists: tenant-configs/${SLUG}.json"
  exit 1
fi

# --- Check template exists ---
if [ ! -f "$TEMPLATE" ]; then
  echo "ERROR: Template not found: tenant-configs/_template.json"
  exit 1
fi

echo "=== PharmaPay: New Tenant ==="
echo ""
echo "  Slug:  $SLUG"
echo "  Name:  $NAME"
echo "  Plan:  $PLAN"
echo ""

# --- Create config from template ---
sed \
  -e "s/CLIENTCODE-01/${SLUG_UPPER}-01/g" \
  -e "s/Pharmacy Name/${NAME}/g" \
  -e "s/clientcode/${SLUG}/g" \
  -e "s/\"starter\"/\"${PLAN}\"/g" \
  "$TEMPLATE" > "$CONFIG_FILE"

echo "Created: tenant-configs/${SLUG}.json"

# --- Set plan limits ---
case "$PLAN" in
  starter)
    sed -i '' -e 's/"max_delivery_boys": 10/"max_delivery_boys": 10/' \
              -e 's/"max_outlets": 1/"max_outlets": 1/' "$CONFIG_FILE"
    ;;
  growth)
    sed -i '' -e 's/"max_delivery_boys": 10/"max_delivery_boys": 50/' \
              -e 's/"max_outlets": 1/"max_outlets": 5/' "$CONFIG_FILE"
    ;;
  enterprise)
    sed -i '' -e 's/"max_delivery_boys": 10/"max_delivery_boys": 999/' \
              -e 's/"max_outlets": 1/"max_outlets": 999/' "$CONFIG_FILE"
    ;;
esac

# --- Create git branch and commit ---
cd "$REPO_ROOT"
git checkout -b "tenant/${SLUG}" 2>/dev/null || git checkout "tenant/${SLUG}"
git add "tenant-configs/${SLUG}.json"
git commit -m "Add tenant config for ${NAME} (${SLUG})"

echo ""
echo "=== Tenant provisioned ==="
echo ""
echo "DNS records to add (CNAME → your server IP):"
echo "  api.${SLUG}.${DOMAIN}"
echo "  admin.${SLUG}.${DOMAIN}"
echo "  store.${SLUG}.${DOMAIN}"
echo ""
echo "URLs:"
echo "  Admin login:  https://admin.${SLUG}.${DOMAIN}"
echo "  Store URL:    https://store.${SLUG}.${DOMAIN}"
echo "  API base:     https://api.${SLUG}.${DOMAIN}/api"
echo ""
echo "Client code for APK: ${SLUG_UPPER}-01"
echo ""
echo "Next steps:"
echo "  1. Add DNS records above"
echo "  2. Run: ./scripts/deploy-platform.sh"
echo "  3. Create admin user via API or database seed"
