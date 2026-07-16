# ─── DemandAI Frontend Startup Script ────────────────────────────────────
# Run: Right-click > "Run with PowerShell"  OR  powershell -File start_frontend.ps1
# From: d:\forecast\

Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  DemandAI - Retail Forecasting Platform" -ForegroundColor Magenta
Write-Host "  Starting React Frontend..." -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta

Set-Location "$PSScriptRoot\frontend"

# Install npm dependencies
Write-Host "`n[1/2] Installing npm packages..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed. Make sure Node.js is installed." -ForegroundColor Red
    Pause
    exit 1
}

Write-Host "`n[2/2] Starting Vite dev server on http://localhost:5173..." -ForegroundColor Green
Write-Host "      Make sure backend is running on http://localhost:8000" -ForegroundColor Cyan
Write-Host "      Press Ctrl+C to stop`n" -ForegroundColor Gray

npm run dev
