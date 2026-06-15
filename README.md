# NewLocalConsole

A self-hosted personal console: a **Django REST** backend and a **React +
TypeScript** single-page app. Access is gated behind username/password **plus a
YubiKey** hardware second factor, with logins expiring after 3 days. Once in, you
land on a dashboard and switch between tool tabs.

## Features

- **Login + YubiKey 2FA** — password first, then a FIDO2/WebAuthn security key
  (e.g. YubiKey). JWT sessions expire after 3 days, after which you re-authenticate
  with password + key.
- **Dashboard** — at-a-glance finances: monthly income, rent status, live
  portfolio value, net-worth estimate, and current holdings.
- **Finance tab** — manually track income, rent payments, stock positions, and
  other balances. Stock prices are fetched live (Yahoo Finance via `yfinance`,
  which supports ASX tickers like `CBA.AX`).
- **Calendar tab** — a custom UI over **Google Calendar + Google Tasks**. Create
  timed events, all-day events, and tasks; because the data lives in your Google
  account, it syncs to your phone automatically.
- **Console tab** — embeds your **CasaOS** instance in an iframe.

> **Note on bank data:** automatic Commonwealth Bank syncing isn't included.
> Accessing CommBank data programmatically requires ACCC *Consumer Data Right*
> accreditation, which isn't available to individuals (aggregators like Basiq need
> the same accreditation to consume). Finance figures are entered manually; the
> backend keeps a pluggable `PriceProvider`/data seam so an API can drop in later.

## Tech stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.11+, Django 5.1, Django REST Framework, SimpleJWT |
| 2FA | `webauthn` (py_webauthn) + `@simplewebauthn/browser` |
| Stocks | `yfinance` |
| Calendar | `google-api-python-client` (Calendar v3 + Tasks v1) |
| Frontend | React 18, TypeScript, Vite, React Router v7, axios |
| Tests | pytest-django, Vitest + Testing Library, Playwright |

## Setup

### 1. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt

cd backend
cp .env.example .env          # then edit secrets
python manage.py migrate
python manage.py createsuperuser
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # set VITE_CASAOS_URL
```

### 3. Run everything

```bash
./devRun.bash                 # backend on :8000, frontend on :5173
```

Open http://localhost:5173.

## First-time auth setup

1. Sign in with your username/password (no key yet → you're let straight in).
2. Go to the **Security keys** tab and click **Register a new key**; touch your
   YubiKey when prompted.
3. Sign out and back in — you'll now be asked to touch your key after the password.

## Google Calendar setup

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project and enable the **Google Calendar API** and **Google Tasks API**.
2. Create an **OAuth client ID** (Desktop app) and download it as
   `backend/client_secrets.json`.
3. Authorize once:

   ```bash
   cd backend
   python manage.py authorize_google
   ```

   This opens a browser, you grant access, and a `token.json` (with a refresh
   token) is saved so the backend can call Google silently afterwards.

## CasaOS in the Console tab

CasaOS sends `X-Frame-Options`, which browsers honour by refusing to embed it in
an iframe. Serve CasaOS behind a reverse proxy that strips the header, e.g. nginx:

```nginx
location / {
    proxy_pass http://casaos-host;
    proxy_hide_header X-Frame-Options;
    add_header Content-Security-Policy "frame-ancestors 'self' http://localhost:5173";
}
```

Point `VITE_CASAOS_URL` at that proxied origin.

## Running with Docker

The whole stack (Django + nginx + React SPA) can be started with a single command.

### Quick start

```bash
# 1. Configure the backend
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set SECRET_KEY and uncomment the Docker block.

# 2. (Optional) Set CasaOS URL if you use the Console tab.
#    VITE_CASAOS_URL is baked into the frontend image at build time.
export VITE_CASAOS_URL=http://your-casaos-host/

# 3. Build images and start
docker compose up --build
```

The app is then available at **http://localhost:8080**.

### Architecture

```
Browser → nginx :8080
           ├─ /api/*  → gunicorn :8000  (backend container)
           └─ /*      → React SPA (compiled static files in nginx)
```

The backend container mounts a named volume (`backend-data`) at `/app/data` where
it stores `db.sqlite3`. On first start `migrate` runs automatically.

### Google Calendar credentials

Copy `client_secrets.json` and (after `authorize_google`) `token.json` into the
volume's data directory. The easiest way is to copy them into the running container:

```bash
docker compose cp client_secrets.json backend:/app/data/
docker compose cp token.json backend:/app/data/
```

Then ensure `backend/.env` has:
```
GOOGLE_CLIENT_SECRETS_PATH=data/client_secrets.json
GOOGLE_TOKEN_PATH=data/token.json
```

### VITE_CASAOS_URL is a build-time argument

Vite inlines environment variables at compile time. Changing `VITE_CASAOS_URL`
requires a frontend rebuild:

```bash
VITE_CASAOS_URL=http://new-host/ docker compose up --build frontend
```

### WebAuthn on non-localhost

`localhost` is a special secure context that browsers allow WebAuthn on.
For remote/non-localhost access you **must** serve over HTTPS. Terminate TLS at a
reverse proxy in front of nginx and update `WEBAUTHN_RP_ID` + `WEBAUTHN_ORIGIN` in
`backend/.env` to match your domain.

### Persistence across restarts

The named volume `backend-data` survives `docker compose down`. To wipe the
database and start fresh:

```bash
docker compose down -v
```

## Testing

```bash
# Backend unit tests
cd backend && pytest

# Frontend unit tests
cd frontend && npm run test

# End-to-end (Django + Vite + browser). Uses a virtual WebAuthn authenticator to
# simulate the YubiKey, a fake price provider, and mocked Google calls — no
# hardware or external accounts required.
cd frontend && npm run e2e
```

## Project layout

```
backend/
  config/          Django project (settings, urls)
  accounts/        Auth: WebAuthn credentials, login + MFA, JWT
  finance/         Income, rent, stocks (live prices), balances, summary
  calendar_app/    Google Calendar + Tasks proxy, authorize_google command
  tests/           pytest-django suite
frontend/
  src/auth/        AuthContext, login, key registration, route guard
  src/pages/       Dashboard, Finance, Calendar, Console
  src/api/         axios client with JWT refresh
  e2e/             Playwright specs + virtual YubiKey helper
```
