# Volve DevOps Stack

Complete reference for the infrastructure, deployment, and environment setup.

## Architecture Overview

```
                    ┌─────────────────────────────────────────────────┐
                    │                  Production Server              │
                    │              (hc-02.meimberg.io)                │
                    │                                                 │
  Internet ──────▶  │  Traefik (reverse proxy, TLS)                   │
                    │    ├── volve.meimberg.io ──────▶ volve (Next.js) │
                    │    ├── volve-api.meimberg.io ──▶ Kong (Supabase) │
                    │    └── volve-studio.meimberg.io ▶ Studio (auth)  │
                    │                                                 │
                    │  Supabase Stack (13 services)                   │
                    │    Kong → Auth, REST, Realtime, Storage, ...    │
                    │    PostgreSQL ← Migrations                      │
                    └─────────────────────────────────────────────────┘
```

## Repository Structure

```
io.meimberg.volve/
├── app/                          # Next.js 16 application
│   ├── src/                      # App source code
│   ├── .env.local                # Local env (gitignored)
│   ├── .env.local.example        # Template for .env.local
│   └── package.json
├── supabase/
│   ├── docker/                   # Self-hosted Supabase stack
│   │   ├── docker-compose.yml    # 13-service Supabase stack
│   │   ├── .env.config           # Shared config (committed)
│   │   ├── .env.example          # Template for .env (committed)
│   │   ├── .env                  # Secrets + env-specific (gitignored)
│   │   ├── .env.runtime          # Auto-merged at runtime (gitignored)
│   │   ├── run.sh                # Helper: merges env + runs compose
│   │   └── volumes/              # Vendored init scripts (Kong, DB, etc.)
│   ├── migrations/               # SQL migration files
│   │   ├── 00001_initial_schema.sql
│   │   └── 00002_seed_process_model.sql
│   └── config.toml               # Supabase CLI config (local dev legacy)
├── .github/workflows/
│   ├── deploy.yml                # App CI/CD
│   └── deploy-supabase.yml       # Supabase infra + migrations CI/CD
├── Dockerfile                    # Multi-stage Next.js build
├── docker-compose.yml            # App Docker (local dev/prod)
├── docker-compose.prod.yml       # App Docker (prod with Traefik)
└── docs/
    ├── DEVOPS.md                 # This file
    └── GITHUB-SETUP.md           # GitHub Secrets/Variables reference
```

## Environment Variable Strategy

### Principle

There are two independent systems that need env vars:

1. **Supabase** (self-hosted Docker stack)
2. **Volve App** (Next.js)

Each follows the same pattern: **configuration is committed, secrets are not.**

### Supabase Env Files (`supabase/docker/`)

| File | Purpose | Committed | Contains secrets |
|------|---------|-----------|-----------------|
| `.env.config` | Shared config identical on local + prod | Yes | No |
| `.env.example` | Template showing what goes in `.env` | Yes | Placeholders only |
| `.env` | Actual secrets + env-specific values | No | Yes |
| `.env.runtime` | Auto-merged `.env.config` + `.env` | No | Yes |

**`.env` is the exact counterpart to GitHub Secrets + Variables.**

How it works:
- `.env.config` has everything that's the same everywhere (DB host, ports, mailer paths, pooler config, etc.)
- `.env` has everything that differs between local and prod (domains, URLs) plus all secrets
- `run.sh` merges both into `.env.runtime` which Docker Compose reads

### App Env Files (`app/`)

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.local.example` | Template for `.env.local` | Yes |
| `.env.local` | Actual secrets for Next.js | No |

### How env vars flow in production

```
GitHub Secrets ──┐
                 ├──▶ deploy-supabase.yml ──▶ generates .env on server
GitHub Variables ┘     merges with .env.config ──▶ .env.runtime
                       docker compose --env-file .env.runtime up -d

GitHub Secrets ──┐
                 ├──▶ deploy.yml ──▶ generates .env on server
GitHub Variables ┘     envsubst docker-compose.prod.yml ──▶ docker-compose.yml
                       docker compose up -d
```

### Variable mapping

Supabase env var names in `.env` map to GitHub with `SB_` prefix:

| `.env` key | GitHub Secret/Variable |
|------------|----------------------|
| `POSTGRES_PASSWORD` | `SB_POSTGRES_PASSWORD` (Secret) |
| `JWT_SECRET` | `SB_JWT_SECRET` (Secret) |
| `API_DOMAIN` | `SB_API_DOMAIN` (Variable) |
| `SITE_URL` | `SB_SITE_URL` (Variable) |
| ... | ... |

App env vars map directly (no prefix):

| `.env.local` key | GitHub Secret/Variable |
|-------------------|----------------------|
| `OPENAI_API_KEY` | `OPENAI_API_KEY` (Secret) |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` (Variable) |
| ... | ... |

## Docker Setup

### Supabase Stack (`supabase/docker/docker-compose.yml`)

13 services based on the official [supabase/supabase](https://github.com/supabase/supabase/tree/master/docker) Docker template:

| Service | Container | Port (local) | Purpose |
|---------|-----------|-------------|---------|
| `studio` | supabase-studio | 3001 | Dashboard UI (basic auth on prod via Traefik) |
| `kong` | supabase-kong | 8000, 8443 | API gateway (routes to auth/rest/realtime/storage) |
| `auth` | supabase-auth | -- | GoTrue auth server (Google OAuth) |
| `rest` | supabase-rest | -- | PostgREST (auto-generated REST API) |
| `realtime` | supabase-realtime | -- | Realtime subscriptions |
| `storage` | supabase-storage | -- | S3-compatible file storage |
| `imgproxy` | supabase-imgproxy | -- | Image transformation |
| `meta` | supabase-meta | -- | Postgres metadata API (for Studio) |
| `functions` | supabase-edge-functions | -- | Deno edge functions |
| `analytics` | supabase-analytics | -- | Logflare analytics |
| `db` | supabase-db | 5432 | PostgreSQL 15 |
| `vector` | supabase-vector | -- | Log collection |
| `pooler` | supabase-pooler | -- | Supavisor connection pooler |

Internal services (no port) are only accessible within the Docker network. Kong acts as the single entry point for all API requests.

### App Docker

**`Dockerfile`** -- Multi-stage build:
1. `deps` -- install npm dependencies
2. `builder` -- build Next.js (standalone output)
3. `runner` -- minimal production image (~150MB)

`NEXT_PUBLIC_*` vars are baked in at build time via `ARG`.

**`docker-compose.yml`** -- Local development (profiles: dev/prod)
**`docker-compose.prod.yml`** -- Production template (envsubst + Traefik labels)

### Networking

- **`internal`** -- Supabase services communicate internally
- **`traefik`** -- External network, shared with Traefik reverse proxy
- Traefik handles TLS termination via Let's Encrypt (`certresolver=le`)

On local: Traefik network must be created manually (`docker network create traefik`), but routing happens via direct port exposure, not Traefik.

## CI/CD Workflows

### `deploy.yml` -- App Deployment

Triggers on every push to `main`.

```
push to main
  │
  ├─ test          lint + build (verify it compiles)
  │
  ├─ build-and-push    Docker build + push to ghcr.io
  │
  └─ deploy        SCP docker-compose.prod.yml to server
                   Generate .env from GitHub Secrets/Variables
                   envsubst to produce final docker-compose.yml
                   docker compose pull + up -d
                   Health check
```

### `deploy-supabase.yml` -- Supabase + Migrations

Triggers on push to `main` when `supabase/**` changes.

```
push to main (supabase/**)
  │
  ├─ Copy files    SCP supabase/docker/ + supabase/migrations/ to server
  │
  ├─ Deploy        Generate .env from GitHub Secrets/Variables
  │                Generate STUDIO_BASIC_AUTH via htpasswd
  │                Merge .env.config + .env -> .env.runtime
  │                docker compose --env-file .env.runtime pull + up -d
  │                Wait 20s + health check (Kong, DB)
  │
  └─ Migrate       Create _migrations tracking table (if not exists)
                   For each migrations/*.sql (sorted):
                     Skip if already in _migrations table
                     Apply via: docker exec supabase-db psql < file.sql
                     Record in _migrations table
```

## Database Migrations

Migration files live in `supabase/migrations/` and are named with a numeric prefix for ordering:

```
supabase/migrations/
├── 00001_initial_schema.sql
├── 00002_seed_process_model.sql
└── 00003_next_change.sql        # add new ones here
```

Tracking: A `_migrations` table in PostgreSQL records which files have been applied. Each migration runs exactly once (idempotent tracking, not idempotent SQL).

**Important:** Migrations must be append-only. Never modify an already-applied migration. To change the schema, add a new migration file.

### Applying migrations locally

When using the **Docker stack** (`supabase/docker`), apply all migrations in order (the deploy workflow uses a custom `_migrations` table; the migration files do not depend on it for the schema changes). To reset and re-apply everything:

```bash
# From repo root: run each migration in order (e.g. after a fresh DB)
for f in supabase/migrations/*.sql; do
  echo "Applying $(basename "$f")"
  docker exec -i supabase-db psql -U postgres -d postgres --set ON_ERROR_STOP=on < "$f"
done
```

When using **Supabase CLI** (`supabase start`), migrations run automatically on `supabase db reset`; no `_migrations` table is used. Migration `00014_fix_rename_columns.sql` is written to work in both setups (it only touches `_migrations` if that table exists).

### Checking migration state locally

If processes/projects appear empty, the DB may still have old column names (`is_template`/`template_id` instead of `is_process`/`source_process_id`). Check with:

```bash
docker exec supabase-db psql -U postgres -d postgres -c "
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'processes' AND column_name IN ('is_process','is_template','is_model');
"
```

You should see `is_process`. If you see `is_template` or `is_model`, re-run migrations (or run `00014_fix_rename_columns.sql` and then `00015_task_list_field_type.sql`). Then check row counts:

```bash
docker exec supabase-db psql -U postgres -d postgres -c "
  SELECT 'processes' AS tbl, COUNT(*) FROM processes
  UNION ALL SELECT 'process_definitions', COUNT(*) FROM processes WHERE is_process = true
  UNION ALL SELECT 'projects', COUNT(*) FROM processes WHERE is_process = false AND status != 'archived';
"
```

(Use `is_template` instead of `is_process` in the last query if the rename has not been applied yet.)

## Local Development

### Prerequisites

- Docker and Docker Compose v2
- Node.js 22
- `htpasswd` (from `apache2-utils`, only needed for generating Studio auth)

### Start Supabase

```bash
cd supabase/docker
cp .env.example .env              # First time only -- fill in secrets
docker network create traefik     # First time only -- required by compose
./run.sh up -d                    # Merges .env.config + .env, starts stack
```

Endpoints:
- **API:** http://localhost:8000
- **Studio:** http://localhost:3001
- **DB:** localhost:5432 (user: `postgres`, password: from `.env`)

### Start App

```bash
cd app
cp .env.local.example .env.local  # First time only
# Update NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
# Update keys to match supabase/docker/.env
npm install
npm run dev                       # http://localhost:3000
```

### Stop everything

```bash
cd supabase/docker && ./run.sh down    # Supabase
# Ctrl+C in app terminal               # App
```

## Production Setup

### Server Requirements

- Docker + Docker Compose v2
- Traefik running with Let's Encrypt (`certresolver=le`, entrypoint `websecure`)
- External Docker network named `traefik`
- SSH access for `deploy` user
- `htpasswd` available (for Studio basic auth generation)
- Directories: `/srv/projects/volve/` and `/srv/projects/volve-supabase/`

### Domains

| Domain | Routes to | Purpose |
|--------|-----------|---------|
| `volve.meimberg.io` | Volve Next.js container | App |
| `volve-api.meimberg.io` | Kong (port 8000) | Supabase API |
| `volve-studio.meimberg.io` | Studio (port 3000) | DB admin (basic auth) |

### Studio Access (Production)

Studio is protected by Traefik basic auth middleware:
- **Username:** `supabase`
- **Password:** Value of `SB_DASHBOARD_PASSWORD` GitHub Secret
- The `htpasswd` hash is auto-generated by the deploy workflow

### Google OAuth

Requires authorized redirect URIs in Google Cloud Console:

| Environment | Redirect URI |
|-------------|-------------|
| Local | `http://localhost:8000/auth/v1/callback` |
| Production | `https://volve-api.meimberg.io/auth/v1/callback` |

### First-Time Deployment

1. Set all GitHub Secrets and Variables (see `docs/GITHUB-SETUP.md`)
2. Configure Google OAuth redirect URIs
3. Push `supabase/` to trigger infra + migration deployment
4. Wait for workflow to complete (~2 min)
5. Push app code (or re-run deploy.yml if it ran too early)
6. Verify: `https://volve.meimberg.io` loads, login works

### Troubleshooting

SSH into server and check:

```bash
# Supabase status
cd /srv/projects/volve-supabase/docker
docker compose --env-file .env.runtime ps
docker compose --env-file .env.runtime logs <service> --tail 50

# App status
cd /srv/projects/volve
docker compose ps
docker compose logs volve --tail 50

# Check if all services are healthy
docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase
```
