# Application mobile en développement (Windows / PowerShell). Usage : .\scripts\dev-mobile.ps1
# Lance une API joignable par le téléphone (réseau Wi-Fi local, port 8001) puis Expo.
# Sur le téléphone : ouvrir Expo Go et scanner le QR code affiché. PC et téléphone sur le même Wi-Fi.
# Le site (scripts\dev.ps1, API sur 127.0.0.1:8000) n'est pas touché.
$root = Split-Path -Parent $PSScriptRoot

$api = "cd '$root\backend'; `$env:CORS_ORIGINS='http://localhost:5173,http://localhost:8080,http://localhost:8081'; .\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $api

Set-Location "$root\frontend\mobile"
if (-not (Test-Path "node_modules")) { npm install --no-audit --no-fund }
$env:EXPO_PUBLIC_API_PORT = "8001"
npx expo start
