# Volve

**Von der Idee zur Umsetzung** -- KI-gestütztes Multi-Inkubator-Workflow-System.

Volve führt Geschäftsideen systematisch durch vordefinierte Entwicklungsstufen: Vom ersten Gedanken (Seed) bis zum umsetzbaren Maßnahmenplan. Der Nutzer wird an jeder Stelle durch spezialisierte KI-Unterstützung maximal assistiert.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **UI:** shadcn/ui (Radix UI), Tailwind CSS 4
- **Editor:** TipTap (Markdown)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** Vercel AI SDK (OpenAI, Anthropic)
- **State:** TanStack Query, Zustand

## Schnellstart

```bash
# Abhängigkeiten installieren
npm install

# Umgebungsvariablen kopieren und konfigurieren
cp .env.local.example .env.local

# Supabase-Migrationen ausführen (im Supabase Dashboard oder via CLI)
# Dateien: supabase/migrations/00001_initial_schema.sql
#          supabase/migrations/00002_seed_process_model.sql

# Entwicklungsserver starten
npm run dev
```

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `OPENAI_API_KEY` | OpenAI API-Schlüssel |
| `ANTHROPIC_API_KEY` | Anthropic API-Schlüssel (optional) |

## Prozessmodell: "Geschäftsidee realisieren"

7 Stufen von der Idee zum Rollout:

1. **Der Funke** -- Seed-Konsolidierung
2. **Die Vision** -- Vision, Naming, Einordnung
3. **Research & Segmentierung** -- Themen, Zielgruppen, Markt
4. **SWOT-Analyse** -- Stärken, Schwächen, Chancen, Risiken
5. **Businessplan** -- Geschäftsmodell, Wettbewerb, Finanzen, Recht
6. **Maßnahmenplan** -- Meilensteine, Aufgaben, Ressourcen
7. **Umsetzung & Rollout** -- Go/No-Go, Rollout, Tasks

## Projektstruktur

```
src/
├── app/                      # Next.js App Router
│   ├── (app)/                # Geschützte App-Routen
│   │   ├── dashboard/        # Prozess-Übersicht
│   │   ├── process/[id]/     # Prozess-Detail
│   │   │   ├── seed/         # Seeding-View
│   │   │   └── stage/[id]/   # Stage-Detail
│   │   └── settings/         # Einstellungen
│   ├── (auth)/login/         # Login-Seite
│   ├── api/ai/generate/      # AI-Streaming-API
│   └── auth/callback/        # OAuth Callback
├── components/
│   ├── ai/                   # AI-Modals
│   ├── field/                # FieldCard, Editor, Tasks
│   ├── layout/               # AppShell, ProcessShell, QuickSwitcher
│   ├── process/              # ProcessCard, SeedingView
│   ├── stage/                # StageOverview, StageDetail
│   └── ui/                   # shadcn/ui Basiskomponenten
├── hooks/                    # Custom React Hooks
├── lib/
│   ├── data/                 # Supabase Data Access Layer
│   └── supabase/             # Supabase Client Setup
└── types/                    # TypeScript Type Definitions
```
