# Volve – Non-Functional Requirements

> **Version:** 1.0  
> **Datum:** 2026-02-14  
> **Scope:** Level 1 – Self-hosted, kleines Team (2–10 Nutzer)  
> **Quellen:** vision.md, use_cases.md, functional_requirements.md, Kontextfragen, bestehender Tech-Stack (io.meimberg.contentmanager)

---

## 1. Überblick

Dieses Dokument definiert alle nicht-funktionalen Anforderungen für Volve Level 1. Die Anforderungen sind nach Kategorien gegliedert und mit IDs versehen (NFR-xxx), um Traceability zu gewährleisten. Jede Anforderung enthält eine Prioritätsstufe:

| Priorität | Bedeutung |
|-----------|-----------|
| **MUSS** | Harter Blocker – ohne diese Anforderung ist das System nicht einsatzfähig |
| **SOLL** | Erwartet für eine solide Basis – Abweichung nur mit bewusster Entscheidung |
| **KANN** | Nice-to-have – wird iterativ nachgeliefert, wenn Kapazität vorhanden |

---

## 2. Technologie-Stack

### 2.1 Stack-Entscheidung

Die Technologiewahl orientiert sich am bestehenden Content-Manager-Projekt, um Synergien bei Wissen, Komponenten und Tooling zu schaffen.

| Schicht | Technologie | Begründung |
|---------|-------------|------------|
| **Framework** | Next.js 15+ (App Router) | Identisch zum Content-Manager. SSR/SSG, API-Routes, Server Actions. |
| **Sprache** | TypeScript (strict mode) | Typsicherheit, bestehende Kompetenz. |
| **UI-Komponenten** | Radix UI / shadcn/ui | Bereits im Content-Manager etabliert. Accessible by default. |
| **Styling** | Tailwind CSS 3/4 + tailwindcss-animate | Konsistenz mit bestehendem Projekt. |
| **Rich-Text-Editor** | TipTap 3 | Bereits im Content-Manager im Einsatz. Markdown-Export, erweiterbar. |
| **State Management** | Tanstack React Query (Server State) + React Context/Zustand (Client State) | React Query bereits im Content-Manager. |
| **Formulare** | React Hook Form + Zod | Bestehende Erfahrung. |
| **Auth** | NextAuth.js (Auth.js) | Bereits im Content-Manager. OAuth/SSO-Support. |
| **Theming** | next-themes | Dark/Light Mode, bereits etabliert. |
| **Icons** | Lucide React | Konsistenz mit bestehendem Projekt. |
| **Notifications** | Sonner | Bereits im Content-Manager. |
| **Datenbank** | PostgreSQL | Robuste relationale DB für das hierarchische Datenmodell. Self-hosted-tauglich. |
| **ORM** | Prisma oder Drizzle ORM | Type-safe DB-Zugriff, Migrations, Schema-Versionierung. |
| **KI-Integration** | Vercel AI SDK | Multi-Provider-Support (OpenAI, Anthropic, lokale Modelle), Streaming, einheitliche API. |
| **Datei-Storage** | Lokales Dateisystem oder S3-kompatibel (MinIO für Self-Hosting) | Flexible Storage-Abstraction. |
| **Containerisierung** | Docker + Docker Compose | Self-Hosting-Standard. Einfache Deployments. |

#### NFR-200: Tech-Stack-Konsistenz (MUSS)

Die Anwendung nutzt den definierten Tech-Stack. Abweichungen erfordern eine dokumentierte Begründung und Architektur-Review.

#### NFR-201: TypeScript Strict Mode (MUSS)

TypeScript wird im `strict`-Modus konfiguriert. Keine `any`-Typen außer in begründeten Ausnahmefällen (mit `// eslint-disable`-Kommentar und Begründung).

#### NFR-202: Shared Component Library (KANN)

Langfristig sollen wiederverwendbare UI-Komponenten (shadcn/ui-basiert) zwischen Volve und dem Content-Manager geteilt werden können (z. B. als internes npm-Package oder Monorepo).

---

## 3. Performance

#### NFR-300: Seitenübergänge (MUSS)

| Metrik | Zielwert |
|--------|----------|
| Dashboard → Stage-Übersicht | < 1 Sekunde (inklusive Datenladen) |
| Stage-Übersicht → Stage-Detail | < 1 Sekunde |
| Step aufklappen (Accordion) | < 200ms (Client-seitig, keine API-Calls) |
| Field-Inhalt speichern (Autosave) | < 500ms API-Response |

#### NFR-301: KI-Streaming-Latenz (MUSS)

| Metrik | Zielwert |
|--------|----------|
| Erster Token nach Auslösung | < 3 Sekunden |
| Sichtbarer Streaming-Start im UI | < 4 Sekunden (inkl. Kontext-Assembly) |
| Visuelles Feedback bei KI-Aufruf | Sofort (< 100ms) – Loading-Spinner/Skeleton |

#### NFR-302: Kontext-Assembly-Performance (SOLL)

| Metrik | Zielwert |
|--------|----------|
| Zusammenstellung des KI-Kontexts | < 500ms (auch bei komplexem Dependency Graph) |
| Dependency-Graph-Auflösung | < 100ms für bis zu 50 Fields |

#### NFR-303: Datenbankabfragen (SOLL)

| Metrik | Zielwert |
|--------|----------|
| Einzelne Prozessinstanz laden (mit Stages, Steps, Fields) | < 200ms |
| Dashboard laden (alle Prozesse eines Nutzers) | < 300ms bei bis zu 100 Prozessinstanzen |
| Field-Update (einzelnes Feld speichern) | < 100ms |

#### NFR-304: Bundle-Größe (SOLL)

| Metrik | Zielwert |
|--------|----------|
| Initiale JS-Bundle-Größe (gzip) | < 250 KB |
| Markdown-Editor (lazy loaded) | < 150 KB (gzip) |
| Largest Contentful Paint (LCP) | < 2,5 Sekunden |

---

## 4. Skalierbarkeit

#### NFR-400: Nutzerlast (MUSS)

| Metrik | Zielwert |
|--------|----------|
| Gleichzeitige Nutzer | 2–10 (Level 1) |
| Gleichzeitige KI-Anfragen | Bis zu 3 parallel (Queue für weitere) |
| Prozessinstanzen pro Nutzer | Unbegrenzt (mindestens 500 ohne Performance-Einbußen) |

#### NFR-401: Datenvolumen (SOLL)

| Metrik | Zielwert |
|--------|----------|
| Fields pro Prozessinstanz | Bis zu 200 (15 Stages × ~3 Steps × ~4 Fields) |
| Seed-Dokumente pro Prozess | Bis zu 20 Dateien |
| Einzelne Seed-Datei | Bis zu 10 MB |
| Gesamter Seed eines Prozesses | Bis zu 50 MB |
| Versionshistorie pro Field | Mindestens 50 Versionen |

#### NFR-402: Horizontale Erweiterbarkeit (KANN)

Die Architektur soll so gestaltet sein, dass eine spätere Skalierung auf mehr Nutzer (Level 2: Multi-Team) ohne grundlegende Umbauten möglich ist. Konkret: Stateless Application Layer, Datenbank als einziger Shared State.

---

## 5. Sicherheit

#### NFR-500: Authentifizierung (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Methode** | OAuth 2.0 / OpenID Connect via NextAuth.js (Auth.js) |
| **Provider (Level 1)** | Mindestens: Google, GitHub. Erweiterbar um: Microsoft, Apple, SAML/SSO. |
| **Session-Management** | JWT-basierte Sessions mit konfigurierbarer Laufzeit (Standard: 7 Tage, Refresh nach 1 Tag). |
| **Fallback** | E-Mail-basierter Magic Link als alternativer Login-Mechanismus. |

#### NFR-501: Autorisierung (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Modell** | Einfaches Owner-Modell in Level 1: Jeder Nutzer sieht nur seine eigenen Prozessinstanzen. |
| **Zukunft (Level 2)** | Erweiterbar um Rollen (Owner, Editor, Viewer) und Team-Sharing. |
| **API-Schutz** | Alle API-Routes erfordern eine gültige Session. Unautorisierte Requests werden mit 401 abgewiesen. |

#### NFR-502: Datensicherheit – Transport (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **HTTPS** | Alle Verbindungen ausschließlich über HTTPS (TLS 1.2+). HTTP-Requests werden auf HTTPS umgeleitet. |
| **KI-API-Kommunikation** | API-Keys für LLM-Provider werden ausschließlich serverseitig verwendet. Kein Client-seitiger Zugriff auf API-Keys. |

#### NFR-503: Datensicherheit – Storage (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Datenbank** | Verschlüsselung der PostgreSQL-Datenbank (Encryption at Rest) über Dateisystem-Level-Verschlüsselung (LUKS oder äquivalent). |
| **Datei-Storage** | Hochgeladene Seed-Dateien werden mit AES-256 verschlüsselt gespeichert. |
| **API-Keys** | LLM-Provider-API-Keys werden als Environment-Variablen oder in einem Secret Store verwaltet – niemals in der Datenbank oder im Code. |

#### NFR-504: Input-Validierung (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Server-seitig** | Alle Inputs werden serverseitig via Zod-Schemas validiert. |
| **Client-seitig** | Zusätzliche Client-seitige Validierung (React Hook Form + Zod) für schnelles Feedback. |
| **File Uploads** | MIME-Type-Validierung, Dateigrößen-Limit, Filename-Sanitization. Nur erlaubte Dateitypen (siehe FR-200). |
| **Markdown** | Sanitization von Markdown-Inhalten gegen XSS (z. B. kein eingebettetes HTML/JS). |

#### NFR-505: Rate Limiting (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **KI-Endpunkte** | Max. 20 KI-Aufrufe pro Nutzer pro Minute. |
| **API allgemein** | Max. 100 Requests pro Nutzer pro Minute. |
| **File Upload** | Max. 10 Uploads pro Minute. |

#### NFR-506: Dependency-Sicherheit (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Audit** | Regelmäßiges `npm audit` (mindestens bei jedem Release). Keine bekannten Critical/High Vulnerabilities in Produktionsabhängigkeiten. |
| **Lockfile** | `package-lock.json` wird committed und im CI validiert. |

---

## 6. Datenschutz & Compliance

#### NFR-600: DSGVO-Grundlagen (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Datenminimierung** | Es werden nur die für den Betrieb notwendigen personenbezogenen Daten erhoben (Name, E-Mail, OAuth-Profil). |
| **Zweckbindung** | Nutzerdaten werden ausschließlich für Authentifizierung und Prozess-Zuordnung verwendet. |
| **Löschbarkeit** | Ein Nutzer kann sein Konto und alle zugehörigen Daten (Prozesse, Seeds, Fields) vollständig löschen. Umsetzung: Cascade Delete über alle verknüpften Entitäten. |

#### NFR-601: Datenresidenz (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Speicherort** | Da self-hosted: Der Betreiber bestimmt den Speicherort. Die Dokumentation weist darauf hin, dass bei EU-Nutzern ein EU-Standort empfohlen wird. |
| **LLM-Provider** | Die Anwendung dokumentiert, welche Daten an welchen LLM-Provider gesendet werden. Der Nutzer wird beim ersten KI-Aufruf darauf hingewiesen und muss einmalig zustimmen. |

#### NFR-602: KI-Transparenz (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Kennzeichnung** | KI-generierte Inhalte werden in der Versionshistorie als „KI-generiert" gekennzeichnet (vs. „manuell bearbeitet"). |
| **Kontext-Offenlegung** | Im „Generate Advanced"-Modal ist sichtbar, welche Daten als Kontext an die KI gesendet werden. |

#### NFR-603: Audit-Log (KANN)

| Aspekt | Spezifikation |
|--------|--------------|
| **Inhalt** | Protokollierung sicherheitsrelevanter Ereignisse: Login/Logout, Prozess erstellen/löschen, KI-Aufrufe (ohne Inhalte), Daten-Export. |
| **Aufbewahrung** | Mindestens 90 Tage. |
| **Format** | Strukturiertes JSON-Log, exportierbar. |

---

## 7. Verfügbarkeit & Zuverlässigkeit

#### NFR-700: Verfügbarkeit (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Ziel** | 99% Uptime (entspricht ~3,65 Tage Downtime/Jahr). Akzeptabel für Self-Hosted-Szenario mit kleinem Team. |
| **Geplante Wartung** | Wartungsfenster dürfen angekündigt werden (z. B. für Updates). Kein Anspruch auf Zero-Downtime-Deployments in Level 1. |

#### NFR-701: Datenpersistenz (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Autosave** | Field-Änderungen werden automatisch gespeichert (Debounce: 2 Sekunden). Der Nutzer sieht einen Statusindikator: „Gespeichert" / „Speichert..." / „Nicht gespeichert". |
| **Kein Datenverlust** | Bei Browser-Absturz oder Verbindungsverlust wird der letzte gespeicherte Stand wiederhergestellt. Unsaved Changes werden per `beforeunload`-Event mit Warndialog abgesichert. |
| **Optimistic Updates** | UI-Updates erfolgen sofort (optimistic). Bei Speicherfehler: Rollback mit Fehlerhinweis und Retry-Option. |

#### NFR-702: Fehlertoleranz KI (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Provider-Ausfall** | Wenn ein LLM-Provider nicht erreichbar ist: Fehlermeldung im UI, Retry-Button, kein Datenverlust. Der bestehende Feldinhalt bleibt unverändert. |
| **Timeout** | KI-Anfragen haben ein Timeout von 60 Sekunden. Nach Timeout: Abbruch mit Fehlermeldung. |
| **Fallback (KANN)** | Konfigurierbare Fallback-Reihenfolge: z. B. Anthropic → OpenAI → lokales Modell. |

#### NFR-703: Backup & Recovery (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Datenbank-Backup** | Tägliches automatisiertes Backup der PostgreSQL-Datenbank (pg_dump). Aufbewahrung: mindestens 30 Tage. |
| **Datei-Backup** | Seed-Dateien werden im Backup-Zyklus eingeschlossen. |
| **Recovery-Ziel** | RPO (Recovery Point Objective): max. 24 Stunden. RTO (Recovery Time Objective): max. 4 Stunden. |
| **Umsetzung** | Docker-Volume-Backup oder hostbasiertes Backup-Script. Dokumentierte Restore-Prozedur. |

---

## 8. Wartbarkeit & Codequalität

#### NFR-800: Code-Struktur (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Architekturmuster** | Klare Schichtentrennung: UI-Komponenten (Presentation) → Hooks/Services (Business Logic) → API-Routes/Server Actions (Data Access) → Datenbank. |
| **Feature-basierte Ordnerstruktur** | Code wird nach Features organisiert (z. B. `src/features/seeding/`, `src/features/stages/`, `src/features/ai/`), nicht nach technischer Rolle. |
| **Shared Code** | Wiederverwendbare Komponenten, Hooks und Utilities in `src/shared/`. |

#### NFR-801: Linting & Formatting (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Linter** | ESLint mit Next.js-Config + strikte TypeScript-Regeln. |
| **Formatter** | Prettier mit projektweiter Konfiguration. |
| **Automatisierung** | Pre-Commit-Hook via Husky + lint-staged. CI-Pipeline schlägt bei Lint-Fehlern fehl. |

#### NFR-802: Testabdeckung (SOLL)

| Ebene | Strategie | Ziel |
|-------|-----------|------|
| **Unit Tests** | Vitest für Business Logic, Zod-Schemas, Utility-Funktionen | ≥ 70% Coverage der Business-Logic-Schicht |
| **Komponenten-Tests** | Testing Library für kritische UI-Komponenten (Field-Karte, KI-Modals, Status-Kaskade) | Alle Kernkomponenten getestet |
| **Integration Tests** | API-Route-Tests mit echtem DB-Zugriff (Testcontainers oder Test-DB) | Alle CRUD-Operationen, Status-Kaskade, Dependency-Auflösung |
| **E2E Tests (KANN)** | Playwright für kritische User Journeys (Prozess erstellen → Seeding → Field bearbeiten → Generate) | Top-3-Flows |

#### NFR-803: Dokumentation (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Code-Dokumentation** | JSDoc für alle öffentlichen Funktionen, Hooks und API-Routes. Komplexe Algorithmen (Dependency-Auflösung, Kontext-Assembly) ausführlich kommentiert. |
| **API-Dokumentation** | Automatisch generiert aus Zod-Schemas (z. B. via zod-to-openapi oder manuell gepflegtes OpenAPI-Spec). |
| **Architektur-Dokumentation** | Architecture Decision Records (ADRs) für alle wesentlichen Technologieentscheidungen. |
| **Setup-Dokumentation** | README mit vollständiger Anleitung: Docker-Setup, Environment-Variablen, erster Start. |

#### NFR-804: Erweiterbarkeit und Template-Verwaltung (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Prozessmodell-Abstraktion** | Prozessmodelle werden als Daten (DB) definiert, nicht als hardcodierte Logik. Level 1 liefert ein Default-Template und einen integrierten Template-Editor, mit dem Prozessmodelle, Stages, Steps und Fields angelegt, bearbeitet, umsortiert und gelöscht werden können. |
| **Snapshot-Prinzip** | Bei Prozesserstellung werden alle Template-Daten (Name, Beschreibung, Typ, AI-Prompt, Dependencies, Reihenfolge) in die Instanz kopiert. Spätere Template-Änderungen wirken nur auf neue Prozesse. |
| **KI-Provider-Abstraktion** | Die KI-Integration wird über eine einheitliche Schnittstelle (Adapter-Pattern) angesprochen. Provider-spezifischer Code ist isoliert. |
| **Plugin-freundlich** | Field-Typen werden als registrierbare Komponenten implementiert. Neue Typen können hinzugefügt werden, ohne bestehenden Code zu ändern. |

---

## 9. Deployment & Betrieb

#### NFR-900: Containerisierung (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Docker** | Multi-Stage-Dockerfile für optimiertes Produktions-Image. |
| **Docker Compose** | `docker-compose.yml` für den vollständigen Stack: App + PostgreSQL + (optional) MinIO. Ein-Befehl-Start: `docker compose up`. |
| **Image-Größe** | Produktions-Image < 500 MB (optimierter Node.js-Build). |

#### NFR-901: Konfiguration (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Environment-Variablen** | Alle konfigurationsrelevanten Werte über Environment-Variablen steuerbar. |
| **Pflicht-Variablen** | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, mindestens ein LLM-Provider-Key |
| **Optionale Variablen** | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| **Validierung** | Beim Start validiert die Anwendung alle Pflicht-Variablen und gibt verständliche Fehlermeldungen bei fehlender Konfiguration. |
| **.env.example** | Vollständige Beispieldatei mit allen Variablen, Beschreibungen und Standardwerten. |

#### NFR-902: Datenbankmigrationen (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Tool** | Prisma Migrate oder Drizzle Kit. |
| **Versionierung** | Alle Migrationsdateien werden im Repository committed. |
| **Automatisierung** | Migrationen werden beim Container-Start automatisch ausgeführt (oder via explizitem Befehl). |
| **Rollback** | Jede Migration muss rückgängig gemacht werden können (Down-Migration). |

#### NFR-903: Health Check (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Endpoint** | `GET /api/health` – öffentlich erreichbar (keine Auth). |
| **Response** | JSON mit Status der Komponenten: App (up/down), Datenbank (connected/disconnected), LLM-Provider (reachable/unreachable). |
| **Docker** | HEALTHCHECK-Direktive im Dockerfile. |

#### NFR-904: Logging (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Format** | Strukturiertes JSON-Logging (z. B. via Pino). |
| **Levels** | `error`, `warn`, `info`, `debug`. Produktionsmodus: `info` und höher. |
| **Inhalte** | Request-Logs (Method, Path, Status, Duration), KI-Aufrufe (Provider, Tokens, Duration, Fehler), Fehler mit Stack-Traces, Authentifizierungsereignisse. |
| **Ausgabe** | stdout/stderr (Docker-Standard). Integration mit externem Log-System (z. B. Loki, Datadog) über Docker-Log-Driver. |
| **Sensible Daten** | Keine Prompts, Feldinhalte oder API-Keys in Logs. Nur Metadaten (Tokenzahl, Provider, Field-ID). |

#### NFR-905: Monitoring (KANN)

| Aspekt | Spezifikation |
|--------|--------------|
| **Metriken** | Grundlegende Metriken exportierbar: Request-Count, Response-Times, KI-Aufrufe/Provider, Fehlerrate. |
| **Format** | Prometheus-kompatibel (via `/api/metrics`-Endpoint) oder JSON-Export. |
| **Alerting** | Kein integriertes Alerting in Level 1. Empfehlung: Externer Monitor (z. B. Uptime Kuma) auf Health-Check-Endpoint. |

---

## 10. Benutzerfreundlichkeit & Barrierefreiheit

#### NFR-1000: Responsivität (MUSS)

| Breakpoint | Verhalten |
|------------|-----------|
| **Desktop** (≥ 1280px) | Vollständige Funktionalität. Optimale Darstellung. |
| **Tablet** (768px–1279px) | Vollständig nutzbar. Stage-Übersicht ggf. vertikal statt horizontal. Modals als Fullscreen-Sheets. |
| **Mobile** (< 768px) | Dashboard und Stage-Übersicht lesbar. Field-Bearbeitung eingeschränkt (Markdown-Editor in Vollbild). KI-Modals als Fullscreen. |

#### NFR-1001: Dark Mode / Light Mode (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Standard** | Dark Mode als Default (gemäß Vision). |
| **Umschaltung** | Toggle in der Navigationsleiste. Präferenz wird persistiert. |
| **System-Präferenz** | Beim ersten Besuch wird die OS-Präferenz (`prefers-color-scheme`) berücksichtigt. |
| **Konsistenz** | Alle Komponenten, Modals und Editoren müssen in beiden Modi visuell stimmig sein. Keine „vergessenen" weißen Flächen im Dark Mode. |

#### NFR-1002: Barrierefreiheit (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Standard** | WCAG 2.1 Level AA. |
| **Tastaturnavigation** | Alle interaktiven Elemente per Tab/Enter/Escape bedienbar. Focus-Trap in Modals. Sichtbarer Focus-Ring. |
| **Screenreader** | Aria-Labels für alle Buttons (insbesondere KI-Aktionen), Status-Änderungen als Live-Regions, sinnvolle Heading-Hierarchie. |
| **Farbkontrast** | Mindestens 4.5:1 für Normaltext, 3:1 für großen Text (gemäß WCAG AA). Die Field-Status-Farben (Blau/Grün) sind auch ohne Farbe unterscheidbar (z. B. durch Icons oder Text-Labels). |
| **Motion** | `prefers-reduced-motion` wird respektiert. Animationen können deaktiviert werden. |

#### NFR-1003: Ladezeiten-Feedback (MUSS)

| Situation | Feedback |
|-----------|----------|
| Seitenwechsel | Sofortiger visueller Übergang (Skeleton oder Fade), kein weißer Blitz. |
| KI-Generierung gestartet | Sofort: Loading-Spinner im Field. Streaming sichtbar innerhalb von 4 Sekunden. |
| KI-Generierung läuft | Streaming-Text erscheint progressiv. Abbrechen-Button sichtbar. |
| Autosave | Dezenter Statustext: „Gespeichert" (verschwindet nach 3s), „Speichert..." (während Save), „Nicht gespeichert" (bei Fehler, persistent). |
| File Upload | Fortschrittsbalken mit Prozentangabe. |

#### NFR-1004: Fehler-UX (MUSS)

| Situation | Verhalten |
|-----------|-----------|
| Validierungsfehler | Inline-Fehlermeldung am betroffenen Feld. Klar formuliert (nicht technisch). |
| API-Fehler (4xx/5xx) | Toast-Notification mit verständlicher Fehlermeldung und Retry-Option (wo sinnvoll). |
| KI-Fehler | Fehlermeldung direkt im Field: „Generierung fehlgeschlagen. [Erneut versuchen]". Bestehender Inhalt bleibt erhalten. |
| Verbindungsverlust | Globaler Banner: „Keine Verbindung – Änderungen werden lokal zwischengespeichert." Auto-Reconnect mit Retry. |

#### NFR-1005: Sprache (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **UI-Sprache** | Deutsch als Standardsprache (Level 1). |
| **i18n-Vorbereitung** | Alle UI-Texte werden über ein Übersetzungssystem (z. B. next-intl oder i18next) gepflegt, auch wenn initial nur Deutsch unterstützt wird. Keine hardcodierten Strings in Komponenten. |
| **KI-Ausgabesprache** | Standard-Prompts erzeugen Ausgaben auf Deutsch. Im „Generate Advanced"-Modal kann die gewünschte Ausgabesprache als Zusatzanweisung angegeben werden. |

---

## 11. KI-spezifische Anforderungen

#### NFR-1100: Provider-Abstraktion (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Adapter-Pattern** | Jeder LLM-Provider wird über einen einheitlichen Adapter angesprochen. Interface: `generateText(prompt, context, options) → AsyncStream<string>`. |
| **Implementierung** | Vercel AI SDK als Abstraktionsschicht. Unterstützte Provider: OpenAI, Anthropic. Lokale Modelle (Ollama) als Stretch-Goal. |
| **Konfiguration** | Der aktive Provider wird per Environment-Variable oder in einer Admin-Einstellung konfiguriert. |

#### NFR-1101: Token-Budgetierung (SOLL)

| Aspekt | Spezifikation |
|--------|--------------|
| **Tracking** | Jeder KI-Aufruf wird mit Tokenzahl (Input + Output) und Provider erfasst. |
| **Transparenz** | Im „Generate Advanced"-Modal wird die geschätzte Kontextgröße in Tokens angezeigt. |
| **Limits (KANN)** | Konfigurierbares monatliches Token-Budget pro Nutzer oder global. Warnung bei 80%, Blockierung bei 100% (deaktivierbar). |

#### NFR-1102: Prompt-Sicherheit (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **System-Prompt** | Jeder KI-Aufruf enthält einen System-Prompt mit Leitplanken: Rolle, erwartetes Output-Format, Sprache, Einschränkungen (kein Code-Execution, keine externen URLs). |
| **Injection-Schutz** | Nutzereingaben (Zusatzanweisungen, Feldinhalte) werden klar vom System-Prompt getrennt (User-Message vs. System-Message). |
| **Output-Validierung** | KI-Output wird auf offensichtliche Fehler geprüft: leer, nur Whitespace, unvollständig abgebrochen (→ Warnung an Nutzer). |

#### NFR-1103: Streaming & Abbruch (MUSS)

| Aspekt | Spezifikation |
|--------|--------------|
| **Streaming** | Alle KI-Generierungen nutzen Streaming (Server-Sent Events). Der Text erscheint progressiv im UI. |
| **Abbruch** | Der Nutzer kann eine laufende Generierung jederzeit über einen „Abbrechen"-Button stoppen. Der bis dahin generierte Text bleibt im Field erhalten. |
| **Parallele Anfragen** | Maximal eine aktive KI-Anfrage pro Field. Mehrere Fields können gleichzeitig generieren (sofern NFR-400 Limits eingehalten). |

---

## 12. Zusammenfassung nach Priorität

### MUSS-Anforderungen (Minimum Viable)

| ID | Kurzbezeichnung |
|----|----------------|
| NFR-200 | Tech-Stack-Konsistenz |
| NFR-201 | TypeScript Strict Mode |
| NFR-300 | Seitenübergänge < 1s |
| NFR-301 | KI-Streaming-Latenz < 3s |
| NFR-400 | 2–10 gleichzeitige Nutzer |
| NFR-500 | OAuth-Authentifizierung |
| NFR-501 | Owner-basierte Autorisierung |
| NFR-502 | HTTPS (TLS 1.2+) |
| NFR-504 | Input-Validierung (Zod) |
| NFR-700 | 99% Uptime-Ziel |
| NFR-701 | Autosave & kein Datenverlust |
| NFR-702 | KI-Fehlertoleranz |
| NFR-703 | Backup & Recovery |
| NFR-800 | Klare Code-Struktur |
| NFR-801 | Linting & Formatting |
| NFR-900 | Docker & Docker Compose |
| NFR-901 | Environment-Variablen-Konfiguration |
| NFR-902 | Datenbankmigrationen |
| NFR-1000 | Responsives UI |
| NFR-1001 | Dark Mode / Light Mode |
| NFR-1003 | Ladezeiten-Feedback |
| NFR-1004 | Fehler-UX |
| NFR-1005 | Deutsche UI-Sprache + i18n-Vorbereitung |
| NFR-1100 | LLM-Provider-Abstraktion |
| NFR-1102 | Prompt-Sicherheit |
| NFR-1103 | Streaming & Abbruch |
| NFR-804 | Erweiterbarkeit und Template-Verwaltung |

### SOLL-Anforderungen (Solide Basis)

| ID | Kurzbezeichnung |
|----|----------------|
| NFR-302 | Kontext-Assembly < 500ms |
| NFR-303 | DB-Abfragen < 200ms |
| NFR-304 | Bundle-Größe < 250 KB |
| NFR-401 | Datenvolumen-Limits |
| NFR-503 | Encryption at Rest |
| NFR-505 | Rate Limiting |
| NFR-506 | Dependency-Audit |
| NFR-600 | DSGVO-Grundlagen |
| NFR-601 | Datenresidenz-Dokumentation |
| NFR-602 | KI-Transparenz |
| NFR-802 | Testabdeckung ≥ 70% |
| NFR-803 | Dokumentation (JSDoc, ADRs, README) |
| NFR-903 | Health Check Endpoint |
| NFR-904 | Strukturiertes Logging |
| NFR-1002 | WCAG 2.1 AA |
| NFR-1101 | Token-Budgetierung |

### KANN-Anforderungen (Iterative Verbesserung)

| ID | Kurzbezeichnung |
|----|----------------|
| NFR-202 | Shared Component Library |
| NFR-402 | Horizontale Skalierbarkeit |
| NFR-603 | Audit-Log |
| NFR-905 | Monitoring / Prometheus |
| NFR-1101 | Token-Budget-Limits (Enforcement) |
