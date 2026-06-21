#!/usr/bin/env bash
# Run the dev stack (Postgres + Django + Vite) in Docker with hot reload.
# Backend: http://localhost:8000  Frontend: http://localhost:5173
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Seed env files from examples on first run.
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

# --build keeps images current; Ctrl-C stops the stack.
exec docker compose up --build
