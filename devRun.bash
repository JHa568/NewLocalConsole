#!/usr/bin/env bash
# Run the Django backend and the Vite frontend together for local development.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$ROOT/logs"

PY="$ROOT/.venv/bin/python"
[ -x "$PY" ] || PY="python"

# Backend (http://localhost:8000)
(
  cd "$ROOT/backend"
  "$PY" manage.py migrate --noinput
  "$PY" manage.py runserver 8000
) > "$ROOT/logs/localConsole_dev.log" 2>&1 &
BACKEND_PID=$!

trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT

# Frontend (http://localhost:5173, proxies /api to the backend)
cd "$ROOT/frontend"
npm run dev
