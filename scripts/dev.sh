#!/usr/bin/env bash
# Démarrage local (Linux/macOS/WSL) : API + interface.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
[ -d .venv ] || { python3 -m venv .venv && .venv/bin/pip install -r requirements.txt; }
.venv/bin/uvicorn app.main:app --reload --port 8000 &
cd "$ROOT/frontend"
[ -d node_modules ] || npm install
npm run dev
