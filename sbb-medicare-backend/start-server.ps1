# SBB Medicare Backend - Server Startup Script
Write-Host "Starting SBB Medicare Backend Server..." -ForegroundColor Green

# Change to project directory
Set-Location $PSScriptRoot

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Warning: .env file not found. Creating from template..." -ForegroundColor Yellow
    node scripts/setup-env.js
}

# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if port is already in use
$port = 5000
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "Port $port is already in use. Stopping existing process..." -ForegroundColor Yellow
    $processId = ($portInUse | Select-Object -First 1).OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Start the server
Write-Host "Starting server on port $port..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:$port" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

node src/server.js

