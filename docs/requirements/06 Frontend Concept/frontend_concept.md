# Volve – Frontend-Konzept & UI-Storyboard

> **Version:** 1.1  
> **Datum:** 2026-02-14  
> **Scope:** Level 1 – UX-Konzept: Masken, Interaktionen, Zustände, Flows  
> **Quellen:** vision.md, use_cases.md, functional_requirements.md, nonfunctional_requirements.md  
> **Hinweis:** Dieses Dokument beschreibt ausschließlich UX-Verhalten – keine Design-Vorgaben (Farben, Typografie, Abstände, Animationstimings). Das visuelle Design wird separat festgelegt.

---

## 1. Navigationsmodell & Screen-Hierarchie

### 1.1 Screen-Baum

```
App-Shell (globaler Header)
├── M-01  Dashboard (Prozessliste)
│         ├── M-02  Neuer-Prozess-Dialog (Modal)
│         └── M-03  Archiv-Filter (Toggle)
│
└── M-04  Prozess-Shell (persistente Stage-Navigation + Breadcrumb)
          ├── M-05  Seeding-View
          ├── M-06  Stage-Übersicht (Timeline)
          └── M-07  Stage-Detail (Step-Accordion)
                    ├── M-08  Field-Karte (pro Field)
                    │         ├── M-09   Generate Inline (Streaming)
                    │         ├── M-10   Generate-Advanced-Modal
                    │         ├── M-11   Optimize-Modal
                    │         ├── M-12   Versionshistorie-Panel
                    │         └── M-13   Dependency-Popover
                    └── M-08T Task-Field-Karte (spezielle Variante)
```

### 1.2 Globale Overlays

| Overlay | Auslöser | Beschreibung |
|---------|----------|-------------|
| **M-14 Quick-Switcher** | Suchicon im Header | Command-Palette: Suche über alle Prozesse, Stages, Steps |
| **M-15 Settings-Panel** | Header-Icon | Dark/Light-Mode, LLM-Provider, Profil |
| **Toast-Notifications** | Systemereignisse | Für Autosave-Bestätigung, Fehler, Erfolge |
| **Bestätigungsdialoge** | Destruktive Aktionen | Archivieren, Field-Inhalt überschreiben |

### 1.3 URL-Routing-Schema

```
/                                    → M-01 Dashboard
/process/:id/seed                    → M-05 Seeding-View
/process/:id                         → M-06 Stage-Übersicht (oder Redirect → letzte Stage)
/process/:id/stage/:stageId          → M-07 Stage-Detail
/process/:id/stage/:stageId/:stepId  → M-07 Stage-Detail (Step aufgeklappt, Scroll-to)
```

Jede URL ist deeplink-fähig und unterstützt Browser-Back/Forward.

---

## 2. App-Shell (globaler Rahmen)

### 2.1 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
│  [Logo: Volve]   [Breadcrumb: …]                   [🔍] [⚙] [👤]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     CONTENT AREA                                 │
│                  (Masken wechseln hier)                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Header-Elemente

| Element | Verhalten |
|---------|-----------|
| **Logo** | Klick → Dashboard (M-01). Von überall erreichbar. |
| **Breadcrumb** | Dynamisch: `Dashboard` / `Prozessname > Stage-Name` / `Prozessname > Stage > Step`. Jedes Segment klickbar. |
| **Such-Icon** | Klick öffnet M-14 (Quick-Switcher). |
| **Settings** | Klick → Settings-Panel (M-15). |
| **User-Avatar** | Klick → Dropdown: Nutzername, Logout. |

### 2.3 Responsive-Verhalten

| Viewport | Anpassung |
|----------|-----------|
| **Desktop** | Voller Header mit allen Elementen |
| **Tablet** | Breadcrumb wird gekürzt (nur letztes Segment + „…"). |
| **Mobile** | Logo wird zum Hamburger-Menü. Breadcrumb kollapiert. Settings/User im Menü. |

---

## 3. M-01: Dashboard (Prozessliste)

### 3.1 Zweck

Startseite der Anwendung. Gibt dem Nutzer sofortigen Überblick über alle laufenden Ideen und ermöglicht den Sprung zur letzten Arbeitsstelle. [UC-05, FR-100]

### 3.2 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER (Breadcrumb: „Dashboard")                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Überschrift: „Meine Ideen"                [Filter ▾] [Sortierung ▾]
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ★ HERVORGEHOBEN: Zuletzt bearbeiteter Prozess              │ │
│  │  🌱 KI-Schulungsplattform                                  │ │
│  │  Stage 4 / 7 · SWOT-Analyse · ████████░░ 60%               │ │
│  │  Zuletzt: vor 2 Stunden · 🔔 2 Tasks warten auf Abnahme   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │ 🔥 Barrierefreihe │  │ 💡 Hosting-Sparte │  │ 🚀 KI-Agenten-  ││
│  │ it-Beratung       │  │                    │  │ Beratung         ││
│  │ Stage 5/7 · 80%   │  │ Stage 2/7 · 30%   │  │ Stage 1/7 · 10%  ││
│  │ Vor 1 Tag         │  │ Vor 3 Tagen        │  │ Vor 1 Woche      ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘│
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─ ─ ─ ─ ─ ─ ─ ─ ┐│
│  │ 📊 SaaS-Platfor  │  │ 🌿 Nachhaltigkei │  │                  ││
│  │ m für Handwerk    │  │ ts-Agentur       │  │  + Neue Idee     ││
│  │ Stage 3/7 · 45%   │  │ Stage 6/7 · 90%   │  │  starten         ││
│  │ Vor 2 Wochen      │  │ Vor 4 Tagen        │  │                  ││
│  └──────────────────┘  └──────────────────┘  └─ ─ ─ ─ ─ ─ ─ ─ ┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Prozess-Kachel – Anatomie

```
┌────────────────────────────────────────┐
│  [Icon] Prozessname                 ⋮  │  ← Kebab-Menü: Umbenennen, Archivieren
│                                        │
│  Stage 4 / 7 · „SWOT-Analyse"         │  ← Aktuelle Stage
│  ████████░░░░░░░░ 57%                  │  ← Fortschrittsbalken
│                                        │
│  🕐 vor 2 Stunden                     │  ← Relative Zeitangabe
│  🔔 2 Tasks warten auf Abnahme        │  ← Badge, nur wenn > 0
└────────────────────────────────────────┘
```

### 3.4 Informationen pro Kachel

| Information | Beschreibung |
|-------------|-------------|
| **Prozess-Icon** | Aus dem Prozessmodell. In Level 1: Plant-Emoji oder nutzerdefiniert. |
| **Prozessname** | Vom Nutzer vergeben. Editierbar über Kebab-Menü → „Umbenennen". |
| **Aktuelle Stage** | Name der ersten nicht-completed Stage. |
| **Fortschrittsbalken** | Gesamtfortschritt: `closed Fields / alle Fields` in Prozent. |
| **Zeitangabe** | Relative Angabe seit letzter Bearbeitung. Tooltip mit absolutem Datum. |
| **Task-Badge** | Zählt Tasks im Status `done` (wartet auf Abnahme). Nur sichtbar wenn > 0. [UC-13] |
| **Hervorhebung** | Zuletzt bearbeiteter Prozess steht an erster Position, visuell abgesetzt. [UC-05] |
| **„+ Neue Idee starten"** | Spezielle Kachel mit gestricheltem Rahmen. Klick öffnet M-02. |

### 3.5 Interaktionen

| Aktion | Ergebnis |
|--------|---------|
| **Klick auf Kachel** | Öffnet den Prozess. Navigiert zur **zuletzt bearbeiteten Stage** (Deeplink), nicht zur Stage-Übersicht. [UC-05] |
| **Klick auf „+ Neue Idee"** | Öffnet M-02 (Neuer-Prozess-Dialog) |
| **Kebab-Menü → Umbenennen** | Inline-Editing des Prozessnamens direkt auf der Kachel |
| **Kebab-Menü → Archivieren** | Bestätigungsdialog → Status = `archived`, Kachel verschwindet. [UC-15] |
| **Filter-Toggle „Archiviert"** | Zeigt zusätzlich archivierte Prozesse (ausgegraut, mit Reaktivieren-Option) |
| **Sortierung** | Letzte Bearbeitung (Standard), Name, Erstellungsdatum, Fortschritt |

### 3.6 Leerzustand (Empty State)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                    🌱                                  │
│           „Noch keine Ideen eingepflanzt"              │
│                                                        │
│    Starte deinen ersten Entwicklungsprozess und        │
│    lass deine Geschäftsidee systematisch wachsen.      │
│                                                        │
│           [ + Erste Idee starten ]                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Motivierender Text mit Pflanzenmetapher. Großer, einladender CTA-Button.

---

## 4. M-02: Neuer-Prozess-Dialog

### 4.1 Zweck

Minimaler Dialog zum schnellen Einspielen einer neuen Idee. Hürde so niedrig wie möglich. [UC-11]

### 4.2 Layout

```
┌────────────────────────────────────────────────┐
│ Neue Idee starten                           ✕  │
├────────────────────────────────────────────────┤
│                                                │
│  Name deiner Idee *                            │
│  ┌────────────────────────────────────────────┐│
│  │ z. B. „KI-Schulungsplattform"              ││
│  └────────────────────────────────────────────┘│
│                                                │
│  💡 Keine Sorge – du kannst den Namen          │
│     jederzeit ändern.                          │
│                                                │
│              [ Abbrechen ]  [ Weiter → ]       │
│                                                │
└────────────────────────────────────────────────┘
```

### 4.3 Verhalten

| Aspekt | Detail |
|--------|--------|
| **Eingabefeld** | Auto-Focus. Pflichtfeld, min. 2 Zeichen. |
| **Prozessmodell** | In Level 1 übersprungen (nur ein Modell). Keine Auswahl nötig. |
| **„Weiter"** | Erzeugt Prozessinstanz (`status: seeding`) und navigiert zu M-05 (Seeding-View). |
| **Validierung** | Inline-Fehler wenn leer: „Bitte gib einen Namen ein." |

---

## 5. M-05: Seeding-View

### 5.1 Zweck

Upload der Ausgangsmaterialien (Sprachnotizen, Skizzen, Dokumente). Der Nutzer „pflanzt den Samen" seiner Idee. [UC-11, FR-200–203]

### 5.2 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER (Breadcrumb: „Dashboard > KI-Schulungsplattform > Seeding")│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Prozessname: KI-Schulungsplattform        ✏️  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │                                                             │ │
│  │              📂  Dateien hierhin ziehen                     │ │
│  │                                                             │ │
│  │           oder klicken zum Auswählen                        │ │
│  │                                                             │ │
│  │   Akzeptiert: .md, .txt, .png, .jpg, .pdf                  │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                                                  │
│  Hochgeladene Dokumente (3)                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⠿ 📝 sprachnotiz-schulung.md     12 KB   vor 2 Min  👁 🗑│   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ⠿ 📝 marktrecherche.md           8 KB    vor 1 Min  👁 🗑│   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ⠿ 🖼 whiteboard-skizze.png       2.4 MB  vor 30 Sek 👁 🗑│   │
│  └──────────────────────────────────────────────────────────┘   │
│  ↕ Drag & Drop zum Umsortieren                                  │
│                                                                  │
│  ℹ️ Die Reihenfolge bestimmt die Priorität für den KI-Kontext.   │
│                                                                  │
│            [ 🌱 Samen einpflanzen (Plant Seed) ]                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Dropzone-Zustände

| Zustand | Verhalten |
|---------|-----------|
| **Leer** | Gestrichelter Rahmen mit Upload-Icon und Hinweistext. |
| **Datei wird über die Zone gezogen** | Visuelles Feedback, dass Drop möglich ist. |
| **Upload läuft** | Fortschrittsanzeige pro Datei. |
| **Fehler** | Fehlermeldung inline: „Dateityp nicht unterstützt" oder „Datei zu groß (max. 10 MB)". |

### 5.4 Dokument-Zeile

| Element | Beschreibung |
|---------|-------------|
| **Drag-Handle** | Links. Ermöglicht Umsortierung per Drag & Drop. |
| **Typ-Icon** | Visuell nach Dateityp unterschieden (Text, Bild, PDF). |
| **Dateiname** | Trunkiert bei langen Namen. Tooltip mit vollem Namen. |
| **Größe** | Formatiert: KB, MB. |
| **Zeitangabe** | Relative Angabe seit Upload. |
| **Vorschau-Button** | Öffnet Vorschau: Markdown gerendert, Bild-Lightbox, PDF-Vorschau. |
| **Löschen-Button** | Bestätigungsdialog: „Dokument ‚xyz.md' entfernen?" |

### 5.5 „Plant Seed"-Button

| Zustand | Verhalten |
|---------|-----------|
| **Deaktiviert** | Wenn keine Dokumente hochgeladen. Nicht klickbar. Tooltip: „Lade mindestens ein Dokument hoch." |
| **Aktiv** | Prominenter Aktions-Button. |
| **Nach Klick** | Status → `active`. Seed wird immutable. Weiterleitung zu M-07 (Stage-Detail der ersten Stage). |

---

## 6. M-04: Prozess-Shell (Container für alle Prozess-Unterseiten)

### 6.1 Zweck

Gemeinsamer Container für alle Ansichten innerhalb eines Prozesses. Stellt die **persistente Stage-Navigation** bereit – der Nutzer kann jederzeit mit einem Klick die Stage wechseln. [FR-303]

### 6.2 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER (Breadcrumb: „Dashboard > KI-Schulungsplattform > SWOT")  │
├──────────────────────────────────────────────────────────────────┤
│ STAGE-TAB-LEISTE                                                 │
│  [✓ Der Funke] [✓ Vision] [✓ Research] [● SWOT ←aktiv] [○ BP]  │
│  [○ Maßnahmen] [○ Rollout]                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     CONTENT AREA                                 │
│           (M-05, M-06 oder M-07 werden hier gerendert)           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Stage-Tab-Leiste

| Element | Beschreibung |
|---------|-------------|
| **Tab pro Stage** | Stage-Name (gekürzt, wenn nötig) + Status-Icon. |
| **Status-Icons** | Drei Zustände: completed (✓), aktiv/in_progress (●), open (○). |
| **Aktive Stage** | Visuell hervorgehoben. |
| **Klick** | Wechselt sofort zur Stage-Detailansicht (M-07). Kein Neuladen. |
| **Overflow** | Bei vielen Stages (>8): horizontales Scrollen oder Overflow-Menü. |

### 6.4 Stage-Tab – Zustände

```
Completed:    [✓ Der Funke]     → abgeschlossen
Aktiv:        [● SWOT]          → wird gerade bearbeitet
Open:         [○ Businessplan]  → noch nicht begonnen
```

---

## 7. M-06: Stage-Übersicht (Timeline)

### 7.1 Zweck

Visueller Gesamtüberblick über alle Stages eines Prozesses. Motivierend, fortschrittsbetont. [FR-300, FR-301]

### 7.2 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ STAGE-TAB-LEISTE (M-04)                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Prozessname: KI-Schulungsplattform       Fortschritt: 57%     │
│   ████████████████████████░░░░░░░░░░░░░░░                       │
│                                                                  │
│   ✅──────✅──────✅──────🔵──────○──────○──────○                │
│   Funke   Vision  Research SWOT   BP    Maßn.  Rollout           │
│    100%    100%    100%    40%    0%     0%      0%               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    STAGE-DETAIL-KARTE                        ││
│  │  🔍 Stage 4: SWOT-Analyse                                   ││
│  │  „Systematische Analyse von Stärken, Schwächen, ..."        ││
│  │                                                              ││
│  │  Steps:   5 von 5 Steps (2 completed)                       ││
│  │  Fields:  12 von 20 Fields abgeschlossen                    ││
│  │                                                              ││
│  │           [ Stage öffnen → ]                                 ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Interaktionen

| Element | Beschreibung |
|---------|-------------|
| **Stage-Knoten** | Kreis mit Status-Icon, verbunden durch Linie. |
| **Hover** | Zeigt Tooltip mit Stage-Beschreibung, Step-Anzahl, Fortschritt. |
| **Klick** | Navigiert zu M-07 (Stage-Detail). |
| **Stage-Detail-Karte** | Unterhalb der Timeline. Zeigt Details der ausgewählten Stage. |

### 7.4 Responsive-Verhalten

| Viewport | Anpassung |
|----------|-----------|
| **Desktop** | Horizontale Timeline |
| **Tablet** | Vertikale Timeline |
| **Mobile** | Einfache Liste mit Stage-Karten |

---

## 8. M-07: Stage-Detail (Step-Accordion)

### 8.1 Zweck

Kernarbeitsbereich. Hier verbringt der Nutzer 80% seiner Zeit. Zeigt alle Steps einer Stage mit ihren Fields. [FR-400, FR-401]

### 8.2 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ STAGE-TAB-LEISTE (M-04)                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 SWOT-Analyse                          Fortschritt: 40%      │
│  Systematische Analyse von Stärken, ...   ████░░░░░░             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ ✅ Stärken (Strengths)                   4/4 Fields closed  ▼││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ 🔵 Schwächen (Weaknesses)               2/4 Fields closed  ▼││
│  ├──────────────────────────────────────────────────────────────┤│
│  │                                                              ││
│  │  ┌── Field-Karte: „Schwächen-Analyse" ──────────────────┐   ││
│  │  │  (siehe M-08)                                         │   ││
│  │  └───────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌── Field-Karte: „Interne Risiken" ────────────────────┐   ││
│  │  │  (siehe M-08)                                         │   ││
│  │  └───────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ ○ Chancen (Opportunities)               0/3 Fields closed  ▼││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ ○ SWOT-Synthese                         0/2 Fields closed  ▼││
│  │     ⚠️ Basiert auf: Stärken, Schwächen, Chancen, Risiken    ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.3 Step-Accordion – Verhalten

| Aspekt | Beschreibung |
|--------|-------------|
| **Step-Header** | Name, Status-Icon (✅/🔵/○), Fortschrittsanzeige „X/Y Fields closed". Klick toggled Expand/Collapse. |
| **Dependency-Warnung** | Wenn Step Dependencies hat und diese nicht completed: Warnhinweis. Nicht blockierend. [FR-601] |
| **Expand-Verhalten** | Mehrere Steps können gleichzeitig offen sein. Standard: Der erste nicht-completed Step ist beim Laden aufgeklappt. |
| **Step completed** | Header zeigt ✅. Alle Fields im `closed`-State (read-only). Step kann aufgeklappt werden, Fields haben Wieder-Öffnen-Buttons. |

### 8.4 Step-Header-Zustände

```
Completed:     ✅ Stärken (Strengths)               4/4 Fields closed
In Progress:   🔵 Schwächen (Weaknesses)             2/4 Fields closed
Open:          ○  Chancen (Opportunities)             0/3 Fields closed
With Warning:  ○  SWOT-Synthese              ⚠️       0/2 Fields closed
```

---

## 9. M-08: Field-Karte (Kern-Komponente)

### 9.1 Zweck

Das atomare Arbeitselement. Hier findet die eigentliche Inhaltserstellung statt – manuell oder KI-gestützt. [FR-402–405]

### 9.2 Layout – Open State

```
┌─────────────────────────────────────────────────────────────────┐
│  Schwächen-Analyse                    [⚡Gen] [⚡+Adv] [🔧Opt]  │ ← KI-Buttons
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  📎 Input von: Vision Statement (Die Vision), Marktrecherche   │ ← Dependency-Hinweis
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Die wesentlichen Schwächen des Vorhabens liegen in:       │  │
│  │                                                            │  │
│  │  1. **Fehlende Markterfahrung** im Bereich KI-Schulungen   │  │
│  │  2. **Begrenztes Budget** für die initiale Vermarktung     │  │ ← Markdown-Editor
│  │  3. ...                                                    │  │
│  │                                                            │  │
│  │  ▍ (Cursor)                                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Automatisch gespeichert · v3          [📋 Versionen] [✓ Abschl.]│ ← Footer
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Layout – Closed State

```
┌─────────────────────────────────────────────────────────────────┐
│  Schwächen-Analyse                                       [✏️]   │ ← Wieder-Öffnen-Button
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│                                                                  │
│  Die wesentlichen Schwächen des Vorhabens liegen in:             │
│  1. **Fehlende Markterfahrung** im Bereich KI-Schulungen        │ ← Read-only Markdown
│  2. **Begrenztes Budget** für die initiale Vermarktung           │
│  3. ...                                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Das Closed-State-Field hat einen visuell anderen Rahmen als Open, der „Abgeschlossen" signalisiert. Die KI-Buttons sind ausgeblendet.

### 9.4 Layout – Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  Schwächen-Analyse                    [⚡Gen] [⚡+Adv]           │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  📎 Input von: Vision Statement, Marktrecherche                 │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│                                                                  │
│         Noch kein Inhalt vorhanden.                              │
│         Klicke „Generate", um KI-gestützt zu starten,            │
│         oder tippe direkt los.                                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ▍ (Cursor – sofort editierbar)                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.5 Layout – Streaming State (während KI-Generierung)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⏳ Wird generiert...                                            │
│  Schwächen-Analyse                              [■ Abbrechen]   │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Die wesentlichen Schwächen des Vorhabens liegen in:       │  │
│  │                                                            │  │
│  │  1. **Fehlende Markterfahrung** im Bereich KI-Schul▍      │  │ ← Text erscheint progressiv
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.6 Elemente & Verhalten

| Element | Verhalten |
|---------|-----------|
| **Field-Name** | Aus dem Template. Dient als Label/Überschrift der Karte. |
| **Status-Rahmen** | `open` und `closed` werden visuell unterschieden (unterschiedlicher Rahmen / Akzent). |
| **KI-Buttons** | Gruppiert im Header. Nur bei `open` Fields und Typen `text` / `long_text`. |
| **Dependency-Hinweis** | Nur sichtbar wenn Dependencies definiert. Klickbar → scrollt zum Quell-Field. Hover → Popover-Vorschau (M-13). [UC-10] |
| **Editor** | Markdown-Editor. **Zero-Click-Editing:** Der Editor ist bei offenen Long-Text-Fields immer aktiv – Klick setzt den Cursor, sofortiges Tippen möglich. Kein Edit-Modus, kein Doppelklick. [UC-03] |
| **Autosave-Indikator** | Im Footer: „Automatisch gespeichert" / „Speichert..." / „Nicht gespeichert" (Fehlerzustand). |
| **Versionszähler** | Im Footer: „v3" – klickbar, öffnet M-12 (Versionshistorie). |
| **Abschließen-Button** | Im Footer. Nur aktiv bei nicht-leerem Inhalt. [UC-04] |
| **Wieder-Öffnen-Button** | Nur bei `closed` State. Dezent. Kein Bestätigungsdialog (Versionshistorie als Safety-Net). [UC-14] |
| **Auto-Scroll nach Abschluss** | Nach dem Abschließen scrollt die UI automatisch zum nächsten offenen Field (sanft, nicht abrupt). [UC-04] |

### 9.7 KI-Buttons

| Button | Verhalten |
|--------|-----------|
| **Generate** | 1-Klick. Bei leerem Field: sofort starten (kein Bestätigungsdialog). Bei gefülltem Field: Bestätigungsdialog „Vorhandenen Inhalt ersetzen?". Streaming inline (M-09). [UC-01] |
| **Generate Advanced** | Öffnet M-10 (Modal mit anpassbarem Prompt). [UC-08] |
| **Optimize** | Nur aktiv wenn Field nicht leer. Öffnet M-11 (Modal). [UC-02] |

### 9.8 Field-Typ-Varianten

| Typ | Editor-Variante | Besonderheiten |
|-----|-----------------|----------------|
| `text` | Einzeiliges Input-Feld | Max. 500 Zeichen. KI-Buttons verfügbar. |
| `long_text` | Markdown-Editor mit Toolbar | Unterstützt Vollbildmodus. KI-Buttons verfügbar. |
| `file` | Upload-Bereich (single) | Dropzone oder Klick. Zeigt Dateiname + Download-Link. Keine KI-Buttons. |
| `file_list` | Upload-Bereich (multi) | Wie `file`, aber mit Liste + Drag-&-Drop-Sortierung. |
| `task` | Task-Karte (M-08T) | Spezielle Darstellung. Siehe Abschnitt 10. |

---

## 10. M-08T: Task-Field-Karte

### 10.1 Zweck

Spezielle Field-Variante für delegierbare Aufgaben mit eigenem Status-Workflow. [FR-700–703]

### 10.2 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TASK                                                            │
│  Domain registrieren                          Status: delegated  │
│  ────────────────────────────────────────────────────────────────│
│                                                                  │
│  BESCHREIBUNG                                 [⚡Gen] [⚡+] [🔧] │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Registriere die Domain ki-schulungsplattform.de bei ...    │  │
│  │ 1. Provider auswählen (empfohlen: ...)                     │  │
│  │ 2. Domain-Verfügbarkeit prüfen                             │  │
│  │ 3. Registrierung durchführen                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ZUORDNUNG                                                       │
│  Assignee: [ Max Müller          ▾ ]   Typ: [ Delegated   ▾ ]   │
│            ↳ Autocomplete                    ↳ Auto-Switch       │
│                                                                  │
│  ERGEBNIS                                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ (Noch kein Ergebnis eingetragen)                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Delegieren ] [ In Bearbeitung ] [ Erledigt ] [ ✓ Abnehmen ]  │
│    ← aktiv       grau              grau          grau            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Task-Status-Flow

```
 [Delegieren]        nur sichtbar bei Status: planned
        ↓
 [In Bearbeitung]    nur sichtbar bei Status: delegated
        ↓
 [Erledigt]          nur sichtbar bei Status: in_progress (Ergebnis muss ausgefüllt sein)
        ↓
 [✓ Abnehmen]        nur sichtbar bei Status: done
        ↓
 → Field wird automatisch closed
```

**Wichtig:** Immer nur der **nächste mögliche Button** ist aktiv/sichtbar. Die anderen sind deaktiviert oder versteckt.

### 10.4 Assignee-Autocomplete

| Aspekt | Verhalten |
|--------|-----------|
| **Vorschläge** | Alle bisher verwendeten Assignee-Namen. Sortiert nach Häufigkeit. |
| **Auto-Typ-Wechsel** | Wenn ein Name eingetragen wird, der nicht der eigene ist → Typ wechselt automatisch zu „Delegated". [UC-12] |
| **Neuer Name** | Freitext möglich. Wird in die Vorschlagsliste aufgenommen. |

---

## 11. M-09: Generate Inline (Streaming im Field)

### 11.1 Zweck

Darstellung des KI-Streaming direkt im Field – kein Modal, kein Overlay. [FR-500, UC-01]

### 11.2 Ablauf (Storyboard)

```
Frame 1: Nutzer klickt [⚡ Generate]
┌──────────────────────────────────┐
│  ⚡ ← Button reagiert            │
└──────────────────────────────────┘

Frame 2: Sofortiges visuelles Feedback
┌──────────────────────────────────┐
│  ⏳ Wird generiert...  [■ Stop]  │
│  ┌──────────────────────────────┐│
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░ ││  ← Skeleton/Shimmer-Platzhalter
│  └──────────────────────────────┘│
└──────────────────────────────────┘

Frame 3: Streaming beginnt
┌──────────────────────────────────┐
│  ⏳ Wird generiert...  [■ Stop]  │
│  ┌──────────────────────────────┐│
│  │ Die wesentlichen Schwäch▍    ││  ← Text erscheint Wort für Wort
│  └──────────────────────────────┘│
└──────────────────────────────────┘

Frame 4: Streaming fertig
┌──────────────────────────────────┐
│  Schwächen-Analyse  [⚡][⚡+][🔧]│  ← KI-Buttons kehren zurück
│  ┌──────────────────────────────┐│
│  │ Die wesentlichen Schwächen...││
│  │ 1. Fehlende Markterfahrung   ││  ← Vollständiger Text
│  │ 2. Begrenztes Budget          ││
│  │ 3. ...▍                       ││  ← Cursor am Ende, Fokus bleibt
│  └──────────────────────────────┘│
│  Gespeichert · v2   [📋] [✓]    │
└──────────────────────────────────┘
```

### 11.3 Abbruch-Verhalten

| Aktion | Ergebnis |
|--------|---------|
| **Klick auf [■ Stop]** | Streaming stoppt sofort. Bisher generierter Text bleibt erhalten. KI-Buttons erscheinen wieder. |
| **Undo nach Streaming** | Stellt den vorherigen Feldinhalt sofort wieder her (letzter KI-Aufruf rückgängig, ohne Versionshistorie öffnen zu müssen). |

---

## 12. M-10: Generate-Advanced-Modal

### 12.1 Zweck

Erweiterte Generierung mit anpassbarem Prompt und Zusatzanweisungen. [FR-501, UC-08]

### 12.2 Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Generate Advanced – „Schwächen-Analyse"                     ✕  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Standard-Prompt                                         [✏️]  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Analysiere die internen Schwächen des Vorhabens          │  │
│  │ basierend auf der Vision und den Marktrecherche-         │  │ ← Read-only
│  │ Ergebnissen. Berücksichtige Ressourcen, Know-how,        │  │    ✏️ klicken = editierbar
│  │ Marktposition und organisatorische Aspekte.              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Zusatzanweisungen (optional)                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ▍                                                        │  │ ← Auto-Focus hier
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Letzte Anweisungen:                                           │
│  [Fokus auf DACH-Markt] [Bitte kurz halten] [Mit Zahlen]      │ ← Klickbare Chips
│                                                                │
│  📊 Kontext: ~4.200 Tokens (Seed + 3 Dependencies)            │ ← Kontext-Transparenz
│                                                                │
│              [ Abbrechen ]  [ ⚡ Generieren ]                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 12.3 Verhalten

| Element | Verhalten |
|---------|-----------|
| **Standard-Prompt** | Read-only Textarea. Klick auf ✏️ macht es editierbar. Änderungen sind **temporär** (nur für diesen einen Durchlauf). |
| **Zusatzanweisungen** | Leeres Textarea. **Auto-Focus** beim Öffnen – der Nutzer kann sofort tippen. Placeholder: „z. B. ‚Schwerpunkt auf Internationalität', ‚Bitte kurz halten'". |
| **Vorschlags-Chips** | Unterhalb der Zusatzanweisungen. Zeigen zuletzt verwendete Anweisungen (max. 5). Klick füllt das Textarea. |
| **Kontext-Info** | Zeigt geschätzte Tokenzahl des zusammengestellten Kontexts. Informativ. |
| **„Generieren"** | Startet Generierung, schließt Modal, Streaming läuft in M-09 inline. |

---

## 13. M-11: Optimize-Modal

### 13.1 Zweck

Vorhandenen Feldinhalt KI-gestützt verbessern. [FR-502, UC-02]

### 13.2 Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Optimieren – „Schwächen-Analyse"                            ✕  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Aktueller Inhalt                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Die wesentlichen Schwächen des Vorhabens liegen in:      │  │
│  │                                                          │  │
│  │ 1. **Fehlende Markterfahrung** im Bereich KI-Schulungen  │  │ ← Read-only, scrollbar
│  │ 2. **Begrenztes Budget** für die initiale Vermarktung    │  │    Markdown gerendert
│  │ 3. **Abhängigkeit von externen KI-Providern**            │  │
│  │ ...                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Quick-Actions:                                                │
│  [Kürzer fassen] [Formeller] [Mit Zahlen] [Einfacher] [Bullets]│ ← Klickbare Chips
│                                                                │
│  Optimierungsanweisung                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ▍                                                        │  │ ← Auto-Focus hier
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│              [ Abbrechen ]  [ 🔧 Optimieren ]                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 13.3 Verhalten

| Element | Verhalten |
|---------|-----------|
| **Aktueller Inhalt** | Read-only. Markdown gerendert. Scrollbar bei langem Text. |
| **Quick-Action-Chips** | Vordefinierte Optimierungen. Klick füllt das Anweisungsfeld. Chips: „Kürzer fassen", „Formeller", „Mit konkreten Zahlen", „Einfacher formulieren", „Bullet Points". |
| **Anweisungsfeld** | **Auto-Focus** beim Öffnen – Nutzer kann sofort tippen. |
| **„Optimieren"** | Startet Optimierung, schließt Modal, Streaming läuft inline. Alter Inhalt → Versionshistorie. |

---

## 14. M-12: Versionshistorie-Panel

### 14.1 Zweck

Einsicht in frühere Stände eines Fields. Diff-Ansicht. Wiederherstellung. [FR-405, UC-09]

### 14.2 Layout (Slide-In-Panel von rechts)

```
┌──────────────────────────────────────┐
│ Versionen – „Schwächen-Analyse"   ✕  │
├──────────────────────────────────────┤
│                                      │
│  Aktuelle Version (v5)               │
│  Vor 2 Minuten · Manuell bearbeitet  │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  v4 · Vor 5 Minuten · 🤖 KI-Optimize│
│  ┌──────────────────────────────────┐│
│  │ - Die wesentlichen Schwächen...  ││ ← Diff: entfernt
│  │ + Die zentralen Schwächen des... ││ ← Diff: hinzugefügt
│  └──────────────────────────────────┘│
│                     [ Wiederherstellen]│
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  v3 · Vor 10 Minuten · 🤖 KI-Generate│
│  ┌──────────────────────────────────┐│
│  │ (Diff-Vorschau)                  ││
│  └──────────────────────────────────┘│
│                     [ Wiederherstellen]│
│                                      │
│  v2 · Vor 15 Minuten · ✍️ Manuell    │
│  v1 · Vor 20 Minuten · 🤖 KI-Generate│
│                                      │
└──────────────────────────────────────┘
```

### 14.3 Verhalten

| Element | Verhalten |
|---------|-----------|
| **Versionsliste** | Chronologisch absteigend (neueste oben). |
| **Versions-Label** | Nummer, relative Zeit, Quelle: KI-Generate, KI-Optimize oder Manuell. |
| **Diff-Vorschau** | Aufklappbar pro Version. Zeigt hinzugefügte und entfernte Zeilen vs. aktuelle Version. |
| **Wiederherstellen** | Setzt den Feldinhalt auf diese Version zurück. Erstellt eine neue Version als Safety-Net. |

---

## 15. M-13: Dependency-Popover

### 15.1 Zweck

Schnelle Vorschau eines referenzierten Fields, ohne den Arbeitskontext zu verlassen. [FR-600, UC-10]

### 15.2 Layout (Popover, erscheint bei Hover)

```
        📎 Input von: Vision Statement (Die Vision)
                         ↓ Hover
        ┌────────────────────────────────────────┐
        │ Vision Statement                       │
        │ Stage: Die Vision · Step: Visionsbeschr.│
        │ ───────────────────────────────────────│
        │                                        │
        │ „Wir schaffen die führende Plattform    │
        │ für KI-gestützte Weiterbildung im       │
        │ DACH-Raum. Unternehmen können ihre ..." │ ← Erste ~200 Zeichen
        │                                        │
        │ [→ Zum Field springen]                  │ ← Klick scrollt hin
        └────────────────────────────────────────┘
```

### 15.3 Verhalten

| Aspekt | Verhalten |
|--------|-----------|
| **Auslöser** | Hover über Dependency-Hinweis. |
| **Inhalt** | Field-Name, Zuordnung (Stage > Step), erste ~200 Zeichen als Markdown-Vorschau. |
| **„Zum Field springen"** | Navigiert zur Stage/Step des referenzierten Fields. Scrollt zum Field. |
| **Leeres Dependency-Field** | Zeigt: „Noch kein Inhalt vorhanden." mit Warnhinweis. |

---

## 16. M-14: Quick-Switcher (Command Palette)

### 16.1 Zweck

Globale Schnellsuche und Navigation. Zu jeder Zeit erreichbar. [FR-304]

### 16.2 Layout

```
┌────────────────────────────────────────────────────────────────┐
│  🔍 Suche nach Prozessen, Stages, Steps...                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ swot▍                                                    │  │ ← Auto-Focus, Echtzeit-Filter
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ZULETZT BEARBEITET                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ● KI-Schulungsplattform > SWOT-Analyse > Stärken        │  │
│  │ ○ Barrierefreiheit > Businessplan > Wettbewerbsanalyse   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  SUCHERGEBNISSE                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📊 Stage: SWOT-Analyse (KI-Schulungsplattform)           │  │
│  │ 📊 Stage: SWOT-Analyse (Hosting-Sparte)                  │  │
│  │ 📝 Step: SWOT-Synthese (KI-Schulungsplattform)           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 16.3 Verhalten

| Aspekt | Verhalten |
|--------|-----------|
| **Suchfeld** | Auto-Focus. Echtzeit-Filterung bei jedem Tastenschlag. |
| **Ergebnisse** | Gruppiert: Zuletzt bearbeitet (priorisiert), dann Suchergebnisse. Zeigt Typ-Icon + vollständigen Pfad. |
| **Auswahl** | Klick oder Enter öffnet ausgewähltes Element. |
| **Navigation** | Prozess → Stage-Übersicht. Stage → Stage-Detail. Step → Stage-Detail mit aufgeklapptem Step. |
| **Leer-Zustand** | „Keine Ergebnisse für ‚xyz'. Versuche einen anderen Suchbegriff." |

---

## 17. M-15: Settings-Panel

### 17.1 Layout

```
┌──────────────────────────────────────┐
│ Einstellungen                     ✕  │
├──────────────────────────────────────┤
│                                      │
│  DARSTELLUNG                         │
│  Theme:  [● Dark] [○ Light] [○ Auto] │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  KI-KONFIGURATION                    │
│  Aktiver Provider:   [ OpenAI    ▾ ] │
│  Modell:             [ gpt-4o    ▾ ] │
│  Ausgabesprache:     [ Deutsch   ▾ ] │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  KONTO                               │
│  Angemeldet als: oliver@meimberg.io  │
│  Provider: Google                    │
│                                      │
│  [ Abmelden ]                        │
│                                      │
└──────────────────────────────────────┘
```

### 17.2 Sektionen

| Sektion | Inhalt |
|---------|--------|
| **Darstellung** | Theme-Toggle: Dark, Light, Auto (folgt OS). Präferenz wird persistiert. |
| **KI-Konfiguration** | LLM-Provider-Auswahl, Modell-Auswahl, Ausgabesprache. |
| **Konto** | Aktuelle Anmeldung, OAuth-Provider, Abmelden. |

---

## 18. Storyboard-Flows

### 18.1 Flow A: Neue Idee einspielen (UC-11)

```
M-01 Dashboard              M-02 Neuer Prozess           M-05 Seeding
┌──────────────┐             ┌───────────────┐            ┌──────────────┐
│              │  Klick „+"  │               │  „Weiter"  │              │
│  + Neue Idee ├────────────>│ Name eingeben ├───────────>│  Dropzone    │
│              │             │               │            │              │
└──────────────┘             └───────────────┘            │  Dateien     │
                                                          │  droppen     │
                                                          │              │
                                                          │ [Plant Seed] │
                                                          └──────┬───────┘
                                                                 │
                                                                 ▼
                                                          M-07 Stage-Detail
                                                          ┌──────────────┐
                                                          │ Stage 1:     │
                                                          │ Der Funke    │
                                                          └──────────────┘

Gesamtzeit: ~60–90 Sekunden · 4 Klicks + Datei-Drop
```

### 18.2 Flow B: Kern-Loop – Ein Field bearbeiten (UC-01 → UC-04)

```
M-07 Stage-Detail (Field ist leer)
┌──────────────────────────┐
│  Schwächen-Analyse       │
│  [⚡ Generate]            │  ← 1 Klick
└──────────┬───────────────┘
           │
           ▼ Streaming (M-09)
┌──────────────────────────┐
│  ⏳ Wird generiert...     │
│  Text erscheint...       │  ← wenige Sekunden
└──────────┬───────────────┘
           │
           ▼ Lesen & ggf. Optimize
┌──────────────────────────┐   ┌────────────────────┐
│  „Hmm, zu oberflächlich" │   │  M-11 Optimize     │
│  [🔧 Optimize]           ├──>│  „Tiefergehend mit  │  ← 2 Klicks
└──────────────────────────┘   │   konkreten Zahlen" │
                               │  [Optimieren]       │
                               └────────┬───────────┘
                                        │
                                        ▼ Streaming
┌──────────────────────────┐
│  Verbessertes Ergebnis   │
│  Manuell Satz ergänzen   │  ← 0 Klicks (Zero-Click-Editing)
│  [✓ Abschließen]         │  ← 1 Klick
└──────────┬───────────────┘
           │
           ▼ Auto-Scroll zum nächsten Field
┌──────────────────────────┐
│  Nächstes offenes Field  │
│  (Fokus + Scroll)        │
└──────────────────────────┘

Gesamtzeit: 1–3 Minuten · 2–5 Klicks pro Field
```

### 18.3 Flow C: Prozess wechseln (UC-06)

```
Option A: Via Dashboard                     Option B: Via Quick-Switcher
┌──────────────────┐                        ┌──────────────────┐
│  M-07 (Prozess A)│                        │  M-07 (Prozess A)│
│  [Logo klicken]  │                        │  [🔍 Suchicon]   │
└────────┬─────────┘                        └────────┬─────────┘
         │                                           │
         ▼                                           ▼
┌──────────────────┐                        ┌──────────────────┐
│  M-01 Dashboard  │                        │  M-14 Switcher   │
│  Prozess B klick │                        │  „hosting" tippen│
└────────┬─────────┘                        │  [Enter]         │
         │                                  └────────┬─────────┘
         ▼                                           │
┌──────────────────┐                                 ▼
│  M-07 (Prozess B)│                        ┌──────────────────┐
│  Letzte Stage    │                        │  M-07 (Prozess B)│
└──────────────────┘                        │  Letzte Stage    │
                                            └──────────────────┘
Option A: 2 Klicks                          Option B: Suche + Enter
```

### 18.4 Flow D: Task delegieren und abnehmen (UC-12 → UC-13)

```
M-07 Stage-Detail (Task-Field)
┌──────────────────────────────┐
│  TASK: Domain registrieren   │
│  Beschreibung: [⚡ Generate]  │  ← KI generiert Arbeitsanweisung
│  Assignee: [ Max Müller ]    │  ← Autocomplete
│  [ Delegieren ]              │  ← Status → delegated
└──────────────────────────────┘

                    ... Tage später ...

M-01 Dashboard
┌──────────────────────────────┐
│  KI-Schulungsplattform       │
│  🔔 1 Task wartet auf Abnahme│  ← Badge sichtbar
│  [Klick]                     │
└──────────┬───────────────────┘
           │
           ▼
M-07 Stage-Detail (Task-Field, Status: done)
┌──────────────────────────────┐
│  TASK: Domain registrieren   │
│  Status: done                │
│  Ergebnis: „Domain xyz.de    │
│  erfolgreich registriert..." │
│  [ ✓ Abnehmen ]             │  ← Status → accepted → Field closed
└──────────────────────────────┘
```

---

## 19. Fehlerzustände & Edge Cases

### 19.1 Fehler-Darstellung pro Kontext

| Kontext | Fehlermeldung | Wo angezeigt |
|---------|---------------|-------------|
| **KI-Generierung fehlgeschlagen** | „Generierung fehlgeschlagen. Bitte versuche es erneut." | Inline im Field + Retry-Button. Alter Inhalt bleibt. |
| **KI-Timeout** | „Die Anfrage hat zu lange gedauert. Bitte versuche es erneut." | Wie oben. |
| **Autosave fehlgeschlagen** | „Änderungen konnten nicht gespeichert werden." | Indikator im Field-Footer + Toast + Retry. |
| **Verbindungsverlust** | „Keine Verbindung – Änderungen werden lokal zwischengespeichert." | Globaler Banner oben. Auto-Reconnect. |
| **Upload-Fehler** | „Dateityp nicht unterstützt" / „Datei zu groß (max. 10 MB)." | Inline in der Dropzone. |
| **Validierungsfehler** | „Bitte gib einen Namen ein." | Inline am Formularfeld. |

### 19.2 Leerzustände

| Maske | Leerzustand |
|-------|-------------|
| **Dashboard (keine Prozesse)** | Illustration + motivierender Text + CTA |
| **Seeding (keine Dokumente)** | Plant-Seed-Button deaktiviert. Hinweis. |
| **Field (leer)** | Platzhaltertext + sofort editierbarer Editor |
| **Quick-Switcher (keine Treffer)** | „Keine Ergebnisse für ‚xyz'." |
| **Versionshistorie (v1)** | Nur aktuelle Version. Hinweis: „Noch keine früheren Versionen." |

### 19.3 Ladezustände

| Maske / Komponente | Ladezustand |
|--------------------|-------------|
| **Dashboard** | Skeleton-Kacheln als Platzhalter |
| **Stage-Detail** | Skeleton-Accordions |
| **Field-Inhalt** | Shimmer-Platzhalter im Editor-Bereich |
| **KI-Streaming** | Shimmer → progressiver Text |
| **Modals** | Sofort sichtbar, kein Skeleton nötig |

---

## 20. Referenzmatrix: Masken → Requirements

| Maske | Adressierte FRs | Adressierte UCs |
|-------|----------------|-----------------|
| M-01 Dashboard | FR-100 | UC-05, UC-06, UC-13, UC-15 |
| M-02 Neuer Prozess | FR-101 | UC-11 |
| M-04 Prozess-Shell | FR-302, FR-303 | UC-07 |
| M-05 Seeding | FR-200, FR-201, FR-202, FR-203 | UC-11 |
| M-06 Stage-Übersicht | FR-300, FR-301 | UC-05, UC-07 |
| M-07 Stage-Detail | FR-400, FR-401 | UC-01–UC-04, UC-07 |
| M-08 Field-Karte | FR-402–FR-405 | UC-01–UC-04, UC-14 |
| M-08T Task-Field | FR-700–FR-703 | UC-12, UC-13 |
| M-09 Generate Inline | FR-500 | UC-01 |
| M-10 Gen. Advanced Modal | FR-501 | UC-08 |
| M-11 Optimize Modal | FR-502 | UC-02 |
| M-12 Versionshistorie | FR-405 | UC-09 |
| M-13 Dependency-Popover | FR-600 | UC-10 |
| M-14 Quick-Switcher | FR-304 | UC-06 |
| M-15 Settings | NFR-1001, NFR-1100 | — |
