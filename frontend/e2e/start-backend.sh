#!/usr/bin/env bash
# Start a fresh, deterministic Django server for end-to-end tests.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/backend"

# Use the repo virtualenv if present, otherwise whatever python is on PATH.
PY="$ROOT/.venv/bin/python"
[ -x "$PY" ] || PY="python"

export SQLITE_NAME="e2e.sqlite3"
export USE_FAKE_PRICES="1"
export WEBAUTHN_RP_ID="localhost"
export WEBAUTHN_ORIGIN="http://localhost:5173"

# Fresh database each run.
rm -f "$ROOT/backend/e2e.sqlite3"
"$PY" manage.py migrate --noinput
"$PY" manage.py seed_e2e

exec "$PY" manage.py runserver 8000 --noreload
