# Deploying Patientia (self-hosted server + GitHub Actions)

Push to `master` → a GitHub Actions **self-hosted runner** on your server rebuilds
and restarts the production stack. The app connects to your **shared hosted
Postgres** (no DB container is run). Secrets come from a GitHub Actions
**environment** named `development`.

Stack: nginx (frontend, port 80) → gunicorn (Django backend) → external Postgres.
Defined in [docker-compose.prod.yml](docker-compose.prod.yml) /
[.github/workflows/deploy.yml](.github/workflows/deploy.yml).

---

## 1. Server prerequisites

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # log out/in afterwards
docker compose version
```

Open port **80** in the firewall / security group. The server must be able to
reach the shared Postgres host on its port.

## 2. Self-hosted runner

GitHub → repo **Settings → Actions → Runners → New self-hosted runner**, run the
shown commands, then install as a service:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

The workflow uses `runs-on: self-hosted`. If the box has multiple runners, add a
label and scope `runs-on` to it.

## 3. Shared database

Patientia needs its **own database** on the shared Postgres instance (it runs its
own migrations into it on every deploy). Create it once:

```sql
CREATE DATABASE patientia;
-- grant the shared DB user access if it doesn't own it already
```

Set the DB name via the `POSTGRES_DB` variable (step 4). The DB user/password/host
come from the existing `SECRET_DB_*` secrets.

## 4. GitHub secrets & variables

Repo → **Settings → Environments → `development`** (create it if missing).

**Secrets** (reuse the shared-DB ones you already have):

| Secret | Notes |
|---|---|
| `SECRET_DB_USERNAME` | shared Postgres user |
| `SECRET_DB_PASSWORD` | shared Postgres password |
| `SECRET_DB_ADDRESS`  | shared Postgres host |
| `SECRET_DB_PORT`     | optional, defaults to `5432` |
| `DJANGO_SECRET_KEY`  | new — `python3 -c 'import secrets;print(secrets.token_urlsafe(64))'` |

> Django signs JWTs with `SECRET_KEY`, so `DJANGO_SECRET_KEY` covers auth too. If
> you'd rather reuse an existing `JWT_SECRET`, point the workflow's
> `DJANGO_SECRET_KEY` env at `${{ secrets.JWT_SECRET }}`.

**Variables** (non-secret):

| Variable | Example |
|---|---|
| `POSTGRES_DB` | `patientia` |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost,YOUR_SERVER_IP` |
| `CORS_ALLOWED_ORIGINS` | `http://YOUR_SERVER_IP` |

## 5. Google OAuth (only if using Calendar/Tasks)

These are files, not env vars. Place them in a `secrets/` dir next to the compose
file in the runner's checkout (`~/actions-runner/_work/Patientia/Patientia/`).
The deploy uses `clean: false`, so they persist; `token.json` is written there at
runtime and survives rebuilds.

```bash
mkdir -p secrets
cp /path/to/client_secrets.json secrets/client_secrets.json
```

## 6. Deploy

```bash
git push origin master      # or run the workflow manually (workflow_dispatch)
```

The job: `docker compose down` → `up -d backend frontend --build`. Migrations run
automatically on backend start ([docker-entrypoint.sh](backend/docker-entrypoint.sh)).

Create the first user:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

---

## Known limitations on an IP-only server

- **YubiKey / WebAuthn login won't work over a raw IP** — FIDO2 needs a real
  domain (or `localhost`) as the RP ID. Set `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGIN`
  once you have a domain (add them to the workflow env + compose).
- **No HTTPS** — plain HTTP. Add a domain + TLS (Caddy or nginx + Let's Encrypt)
  before exposing publicly.
- **Django admin / DRF browsable API** are not proxied — nginx only forwards
  `/api/` ([frontend/nginx.conf](frontend/nginx.conf)).

## Troubleshooting

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml ps
```

- `SECRET_KEY must be set via env in production` → `DJANGO_SECRET_KEY` secret missing.
- `DEBUG must be False in production` → compose sets this; check you're using `docker-compose.prod.yml`.
- DB connection refused → server can't reach `SECRET_DB_ADDRESS`, or the `patientia` database/user grants are missing.
