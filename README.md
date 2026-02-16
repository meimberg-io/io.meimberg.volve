# Volve

AI-powered structured process management. Guide any complex endeavor -- from business idea to launch -- through defined stages, steps, and fields with AI assistance at every level.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Tiptap
- **Backend:** Self-hosted Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI:** OpenAI + Anthropic via Vercel AI SDK
- **Infra:** Docker, Traefik, GitHub Actions CI/CD

## Quick Start

### Prerequisites

- Docker & Docker Compose v2
- Node.js 22

### 1. Start Supabase

```bash
cd supabase/docker
cp .env.example .env        # Fill in secrets (see docs/GITHUB-SETUP.md)
docker network create traefik
./run.sh up -d
```

### 2. Apply Migrations

```bash
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/00001_initial_schema.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/00002_seed_process_model.sql
```

### 3. Start App

```bash
cd app
cp .env.local.example .env.local   # Point to localhost:8000, add keys
npm install
npm run dev                         # http://localhost:3000
```

## Documentation

- [DevOps & Infrastructure](docs/DEVOPS.md) -- Docker, deployments, env strategy, CI/CD
- [GitHub Setup](docs/GITHUB-SETUP.md) -- Secrets, variables, first-time deployment

## Project Structure

```
app/              Next.js application
supabase/
  docker/         Self-hosted Supabase stack (13 services)
  migrations/     SQL schema & seed data
docs/             Infrastructure documentation
```

## Deployment

Push to `main` triggers automated deployment via GitHub Actions. See [docs/DEVOPS.md](docs/DEVOPS.md) for details.
