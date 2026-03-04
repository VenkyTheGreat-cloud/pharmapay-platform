#!/usr/bin/env bash
set -euo pipefail

echo "=== SBB Medicare Deploy ==="

# Build store frontend
echo "Building store frontend..."
cd sbb-medicare-store
npm ci
VITE_API_URL=/api npm run build
cd ..

# Build admin frontend
echo "Building admin frontend..."
cd sbb-medicare-admin
npm ci
VITE_API_URL=/api npm run build
cd ..

# Start services
echo "Starting Docker services..."
docker compose up -d --build

echo ""
echo "=== Deploy complete ==="
echo "Store:  http://localhost/"
echo "Admin:  http://localhost/admin/"
echo "Health: http://localhost/health"
