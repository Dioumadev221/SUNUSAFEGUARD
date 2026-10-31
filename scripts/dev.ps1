# Démarrage local sous Windows (PowerShell). Usage : .\scripts\dev.ps1
# Prérequis : Python 3.11+ et Node.js 20+.
$root = Split-Path -Parent $PSScriptRoot
Set-Location "$root\backend"
if (-not (Test-Path ".venv")) { python -m venv .venv }
# Installe les dépendances manquantes (rapide si tout est déjà à jour).
.\.venv\Scripts\pip install -q -r requirements.txt
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\.venv\Scripts\uvicorn app.main:app --reload --port 8000"

Set-Location "$root\frontend"
npm install --no-audit --no-fund
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "API : http://localhost:8000/api/docs  |  Interface : http://localhost:5173"
