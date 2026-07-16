# ─── DemandAI Backend Startup Script ─────────────────────────────────────
# Run: Right-click > "Run with PowerShell"  OR  powershell -File start_backend.ps1
# From: d:\forecast\

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DemandAI - Retail Forecasting Platform" -ForegroundColor Cyan
Write-Host "  Starting FastAPI Backend..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Install Python dependencies
Write-Host "`n[1/2] Installing Python dependencies..." -ForegroundColor Yellow
pip install -r "$PSScriptRoot\backend\requirements.txt" --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pip install failed. Make sure Python is installed." -ForegroundColor Red
    Pause
    exit 1
}

Write-Host "[2/2] Starting FastAPI server on http://localhost:8000..." -ForegroundColor Green
Write-Host "      API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "      Press Ctrl+C to stop`n" -ForegroundColor Gray

Set-Location "$PSScriptRoot\backend"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
