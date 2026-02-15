# GitHub Repository Setup

This document describes the required GitHub Secrets and Variables for the CI/CD pipeline.

## Workflows

- **`deploy.yml`** -- Builds and deploys the Volve Next.js app. Triggered on every push to `main`.
- **`deploy-supabase.yml`** -- Deploys self-hosted Supabase infrastructure + applies database migrations. Triggered on push to `main` when files in `supabase/` change. Runs in order: deploy infra → health check → apply migrations.

## .env Strategy

| File | Contents | Committed? |
|------|----------|------------|
| `.env.config` | Shared config, identical on local + prod, no secrets | Yes |
| `.env.example` | Template for `.env` -- shows what you need to fill in | Yes |
| `.env` | Secrets + env-specific values (= GitHub Secrets + Variables) | No |
| `.env.runtime` | Auto-merged `.env.config` + `.env` (used by Docker Compose) | No |

**`.env` is the exact counterpart to GitHub Secrets + Variables.**

- **Local:** `cp .env.example .env`, fill in secrets, use `./run.sh up -d`
- **Prod:** Workflow writes GitHub Vars + Secrets to `.env`, merges with `.env.config`

## GitHub Secrets (Repository Settings -> Secrets and variables -> Actions -> Secrets)

### Infrastructure

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | SSH key for server deployment |

### App

| Secret | Description | Generate with |
|--------|-------------|---------------|
| `OPENAI_API_KEY` | OpenAI API key | From OpenAI dashboard |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | From Anthropic dashboard |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | From Google Cloud Console |

### Supabase (`SB_` prefix)

| Secret | Description | Generate with |
|--------|-------------|---------------|
| `SB_POSTGRES_PASSWORD` | PostgreSQL password | `openssl rand -base64 32` |
| `SB_JWT_SECRET` | JWT signing secret (min 32 chars) | `openssl rand -base64 32` |
| `SB_ANON_KEY` | Supabase anon/public JWT | See "Generating JWT Keys" |
| `SB_SERVICE_ROLE_KEY` | Supabase service role JWT | See "Generating JWT Keys" |
| `SB_DASHBOARD_PASSWORD` | Studio dashboard password | `openssl rand -base64 16` |
| `SB_SECRET_KEY_BASE` | Realtime/Supavisor secret | `openssl rand -base64 48` |
| `SB_VAULT_ENC_KEY` | Vault encryption key | `openssl rand -hex 16` |
| `SB_PG_META_CRYPTO_KEY` | PG Meta encryption key | `openssl rand -hex 16` |
| `SB_LOGFLARE_PUBLIC_TOKEN` | Logflare public access token | `openssl rand -base64 32` |
| `SB_LOGFLARE_PRIVATE_TOKEN` | Logflare private access token | `openssl rand -base64 32` |

### Generating JWT Keys

`SB_ANON_KEY` and `SB_SERVICE_ROLE_KEY` are JWTs signed with `SB_JWT_SECRET`:

```
Anon key payload:     {"role": "anon", "iss": "supabase", "iat": 1641769200, "exp": 1799535600}
Service role payload: {"role": "service_role", "iss": "supabase", "iat": 1641769200, "exp": 1799535600}
```

See https://supabase.com/docs/guides/self-hosting/docker#api-keys

## GitHub Variables (Repository Settings -> Secrets and variables -> Actions -> Variables)

### App

| Variable | Description | Value |
|----------|-------------|-------|
| `APP_DOMAIN` | Volve app domain | `volve.meimberg.io` |
| `SERVER_HOST` | Server IP/hostname | |
| `SERVER_USER` | SSH user for deployment | `deploy` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | `https://volve-api.meimberg.io` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (same as `SB_ANON_KEY`) | |

### Supabase (`SB_` prefix) -- env-specific config

| Variable | Description | Value |
|----------|-------------|-------|
| `SB_API_DOMAIN` | Supabase API domain (Traefik routing) | `volve-api.meimberg.io` |
| `SB_STUDIO_DOMAIN` | Studio domain (Traefik routing) | `volve-studio.meimberg.io` |
| `SB_SITE_URL` | App URL (for auth redirects) | `https://volve.meimberg.io` |
| `SB_ADDITIONAL_REDIRECT_URLS` | Allowed redirect URLs | `https://volve.meimberg.io/**` |
| `SB_API_EXTERNAL_URL` | External Supabase API URL | `https://volve-api.meimberg.io` |
| `SB_SUPABASE_PUBLIC_URL` | Public Supabase URL (Studio) | `https://volve-api.meimberg.io` |

## Local Development

### Supabase (self-hosted via Docker)

```bash
cd supabase/docker
cp .env.example .env
# Fill in secrets (generate or copy from existing .env)
./run.sh up -d
```

Services available at:
- **API (Kong):** http://localhost:8000
- **Studio:** http://localhost:3001
- **Database:** localhost:5432

### Volve App

```bash
cd app
# .env.local should point to local Supabase
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
npm run dev
```

## Server Requirements

- Docker and Docker Compose installed
- SSH access configured
- Traefik reverse proxy running (for HTTPS/TLS via Let's Encrypt)
- Directories: `/srv/projects/volve/` and `/srv/projects/volve-supabase/`

## First-Time Setup

1. Set all GitHub Secrets and Variables listed above
2. Push the `supabase/docker/` files to trigger Supabase deployment
3. Wait for Supabase to be healthy (~30s)
4. Push `supabase/migrations/` to trigger automatic migration (tracked via `_migrations` table)
5. Push app code to trigger app deployment
