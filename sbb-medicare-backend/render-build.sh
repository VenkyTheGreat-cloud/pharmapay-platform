#!/usr/bin/env bash
# Render build script for SBB Medicare Backend

set -e

echo "Installing dependencies..."
npm install --production=false

echo "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads

echo "Build completed successfully!"
