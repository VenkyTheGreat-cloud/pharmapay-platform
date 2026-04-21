#!/bin/bash
set -e
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "SwinkPayPharma - PWA Build Script"
echo "=========================================="

# Clean
rm -rf dist .expo
echo "Cleaned previous build artifacts"

# Install deps
npm install
echo "Dependencies installed"

# Build PWA
npx expo export --platform web
echo "PWA build completed"

# Verify
if [ ! -d "dist" ]; then
    echo "ERROR: dist folder not created"
    exit 1
fi

# SPA redirects
echo "/*    /index.html   200" > dist/_redirects

DIST_SIZE=$(du -sh dist | cut -f1)
FILE_COUNT=$(find dist -type f | wc -l)
echo ""
echo "=========================================="
echo "PWA BUILD SUCCESSFUL"
echo "=========================================="
echo "Size: $DIST_SIZE | Files: $FILE_COUNT"
echo "Output: $SCRIPT_DIR/dist"
echo ""
echo "To test locally: npx serve dist"
echo "To deploy: copy dist/ to server"
