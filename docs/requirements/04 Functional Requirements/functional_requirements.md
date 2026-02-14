# Volve – Funktionales Applikationskonzept

> **Version:** 1.0  
> **Datum:** 2026-02-14  
> **Scope:** Level 1 – Business-Development-Tool (festes Prozessmodell)  
> **Quellen:** seed_01.md, seed_02.md, vision.md, use_cases.md

---

## 1. Einführung

### 1.1 Zweck dieses Dokuments

Dieses Dokument überführt die Produktvision und Seed-Dokumente in ein konkretes, implementierungsreifes Applikationskonzept. Es definiert alle funktionalen Anforderungen, das Domänenmodell, die Benutzeroberfläche und die Geschäftsregeln, die für die Entwicklung von Volve Level 1 erforderlich sind.

### 1.2 Produktüberblick

Volve ist ein KI-gestütztes Workflow-Management-System, das unstrukturierte Geschäftsideen systematisch durch vordefinierte Entwicklungsstufen führt – vom ersten Gedanken (Seed) bis zum umsetzbaren Maßnahmenplan. Der Nutzer wird an jeder Stelle durch spezialisierte KI-Unterstützung maximal assistiert, behält aber die vollständige Steuerung.

### 1.3 Zielgruppe

Unternehmer, Gründer und Innovationsverantwortliche, die eine Vielzahl an Geschäftsideen parallel strukturiert entwickeln und zur Umsetzungsreife bringen möchten.

### 1.4 Scope-Abgrenzung

| In Scope (Level 1) | Out of Scope (Level 2 – Zukunft) |
|---------------------|----------------------------------|
| Festes, vordefiniertes Prozessmodell für Geschäftsideen-Entwicklung | Nutzerkonfigurierbare Prozessmodelle |
| Vordefinierte Stages, Steps und Fields mit Standard-Prompts | Generische Workflow-Engine / Meta-Modell |
| KI-Aktionen: Generate, Generate Advanced, Optimize | Eigene Modell-Editoren für Endnutzer |
| Task-Management (Self-assigned, Delegated) | Agent-Tasks (automatisierte Ausführung) |
| Single-User-Betrieb | Multi-User / Team-Kollaboration |

### 1.5 Referenzdokumente

- `docs/requirements/01 Seed/seed_01.md` – Ursprüngliche Ideenskizze
- `docs/requirements/01 Seed/seed_02.md` – Konzeptionelle Ausarbeitung (Datenmodell, UI, KI)
- `docs/requirements/02 Vision/vision.md` – Konsolidierte Produktvision
- `docs/requirements/03 Use Cases/use_cases.md` – Use Cases, User Journeys und Effizienz-Anforderungen
- `docs/requirements/06 Frontend Concept/frontend_concept.md` – Detailliertes Frontend-Konzept & UI-Storyboard

---

## 2. Systemübersicht

### 2.1 Architekturprinzipien

| Prinzip | Beschreibung |
|---------|-------------|
| **Mensch steuert, KI assistiert** | Kein autonomer Agent – der Nutzer behält an jedem Punkt die Kontrolle und entscheidet, wann und wie KI eingesetzt wird. |
| **Prozess als Leitplanke** | Ein vordefiniertes Prozessmodell gibt Struktur, ohne den Nutzer einzuschränken. Steps können in beliebiger Reihenfolge bearbeitet werden. |
| **Markdown als Lingua Franca** | Alle textuellen Inhalte werden intern als Markdown gespeichert und verarbeitet. Die UI rendert Rich-Text, der Kern bleibt reines Markdown. |
| **Kontextuelle Ketten** | Jede Stufe baut auf den Ergebnissen vorheriger Stufen auf. Der Dependency Graph stellt sicher, dass Kontext systematisch weiterfließt. |
| **Inkrementelle Reife** | Eine Idee reift schrittweise. Jedes Field, jeder Step und jede Stage hat einen expliziten Abschlussstatus, der Fortschritt sichtbar macht. |

### 2.2 Hauptprozess (End-to-End)

```
┌─────────┐    ┌─────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐
│  Prozess │───>│ Seeding │───>│ Stage-       │───>│ Step/Field-  │───>│ Prozess   │
│  starten │    │ (Upload)│    │ Übersicht    │    │ Bearbeitung  │    │ abschluss │
└─────────┘    └─────────┘    └──────────────┘    └──────────────┘    └───────────┘
                                     ▲                    │
                                     └────────────────────┘
                                      (nächste Stage)
```

---

## 3. Domänenmodell

### 3.1 Entity-Relationship-Übersicht

```
Prozessmodell (Template)
 ├── name: String
 ├── description: String
 ├── icon: String
 └── stages: Stage[] (geordnet)

Prozessinstanz
 ├── id: UUID
 ├── name: String (vom Nutzer vergeben)
 ├── prozessmodell: Prozessmodell (Referenz)
 ├── seed: Seed
 ├── status: Enum [seeding, active, completed, archived]
 ├── created_at: DateTime
 ├── updated_at: DateTime
 └── stages: StageInstanz[] (geordnet)

Seed
 ├── id: UUID
 ├── documents: SeedDocument[]
 └── consolidated: Markdown (optional – Ergebnis der Konsolidierung)

SeedDocument
 ├── id: UUID
 ├── type: Enum [markdown, image, transcript]
 ├── content: Text | Binary
 ├── filename: String
 └── uploaded_at: DateTime

StageInstanz
 ├── id: UUID
 ├── stage_template: Stage (Referenz)
 ├── name: String
 ├── icon: String
 ├── order: Integer
 ├── completed: Boolean (berechnet)
 └── steps: StepInstanz[] (geordnet)

StepInstanz
 ├── id: UUID
 ├── step_template: Step (Referenz)
 ├── name: String
 ├── order: Integer
 ├── completed: Boolean (berechnet)
 ├── dependencies: StepInstanz[] (optional)
 └── fields: FieldInstanz[] (geordnet)

FieldInstanz
 ├── id: UUID
 ├── field_template: Field (Referenz)
 ├── name: String
 ├── type: Enum [text, long_text, file, file_list, task]
 ├── order: Integer
 ├── prompt: String (Standard-Prompt aus Template)
 ├── content: Text | Markdown | null
 ├── closed: Boolean
 ├── dependencies: FieldInstanz[] (optional)
 └── task: TaskData | null (nur bei type=task)

TaskData
 ├── description: Markdown
 ├── assignee: String
 ├── task_type: Enum [self_assigned, delegated, agent]
 ├── status: Enum [planned, delegated, in_progress, done, accepted]
 └── result: Markdown | null
```

### 3.2 Template vs. Instanz

Das System unterscheidet zwischen **Templates** (Prozessmodell-Definition – was soll passieren) und **Instanzen** (konkrete Durchführungen – was passiert gerade). In Level 1 ist das Template fest eingebaut. Bei Prozessstart wird aus dem Template eine vollständige Instanz-Hierarchie erzeugt.

### 3.3 Zusammengesetzte Beziehungen

| Beziehung | Kardinalität | Beschreibung |
|-----------|-------------|-------------|
| Prozessmodell → Stage | 1 : n (geordnet) | Ein Modell definiert 5–15 Stages |
| Stage → Step | 1 : n (geordnet) | Eine Stage enthält 1–15 Steps |
| Step → Field | 1 : n (geordnet) | Ein Step enthält 1–n Fields |
| Field → Field (Dependency) | n : m | Ein Field kann Inhalte anderer Fields als Input referenzieren |
| Step → Step (Dependency) | n : m | Ein Step kann andere Steps innerhalb derselben Stage voraussetzen |
| Prozessinstanz → Seed | 1 : 1 | Jede Instanz hat genau einen Seed |
| Seed → SeedDocument | 1 : n | Ein Seed besteht aus einem oder mehreren Dokumenten |

---

## 4. Funktionale Anforderungen

### 4.1 FB1 – Prozess-Lebenszyklusverwaltung

#### FR-100: Prozessliste (Dashboard)

Der Nutzer sieht beim Öffnen der Anwendung eine Übersicht aller seiner Prozessinstanzen.

| Aspekt | Spezifikation |
|--------|--------------|
| **Darstellung** | Kachel- oder Listenansicht aller Prozessinstanzen |
| **Angezeigte Informationen** | Name, Prozessmodell-Icon, Status, aktuelle Stage, Fortschrittsindikator (z. B. „Stage 3/7"), Erstellungsdatum, letzte Bearbeitung, offene Tasks im Status „wartet auf Abnahme" (Badge) |
| **Sortierung** | Standard: Letzte Bearbeitung (neueste zuerst); alternativ: Name, Erstellungsdatum |
| **Hervorhebung** | Die zuletzt bearbeitete Prozessinstanz ist visuell hervorgehoben (erste Position, dezenter Akzent) [UC-05] |
| **Deeplink** | Beim Öffnen eines Prozesses landet der Nutzer in der **zuletzt bearbeiteten Stage**, nicht in der Stage-Übersicht [UC-05, EA-05] |
| **Aktionen** | Neuen Prozess starten, Prozess öffnen, Prozess archivieren |

#### FR-101: Neuen Prozess starten

| Aspekt | Spezifikation |
|--------|--------------|
| **Auslöser** | Nutzer klickt „Neuen Prozess starten" |
| **Schritt 1** | Auswahl eines Prozessmodells (in Level 1: nur ein Modell → Auswahl wird übersprungen, direkt Namenseingabe) [UC-11] |
| **Schritt 2** | Vergabe eines Namens für die Prozessinstanz (Pflichtfeld, später änderbar) |
| **Ergebnis** | Neue Prozessinstanz wird erzeugt (Status: `seeding`). Alle Stages, Steps und Fields werden aus dem Template instanziiert. Weiterleitung zur Seeding-View. |

#### FR-102: Prozess archivieren

| Aspekt | Spezifikation |
|--------|--------------|
| **Auslöser** | Nutzer wählt „Archivieren" in der Prozessliste |
| **Verhalten** | Status wird auf `archived` gesetzt. Prozess verschwindet aus der Standard-Ansicht, ist aber über einen Filter „Archiviert" weiterhin zugänglich. |
| **Bedingung** | Ein archivierter Prozess kann reaktiviert werden. |

#### FR-103: Prozess-Status-Übergänge

```
seeding ──(Seed gespeichert)──> active ──(alle Stages completed)──> completed
                                  │
                                  └──(manuell)──> archived
```

---

### 4.2 FB2 – Seeding (Prozess-Initiierung)

#### FR-200: Seeding-View

Die Seeding-View ist die erste Ansicht nach Erstellung einer neuen Prozessinstanz. Hier lädt der Nutzer die Ausgangsmaterialien hoch.

| Aspekt | Spezifikation |
|--------|--------------|
| **Layout** | Zentraler Bereich mit Dropzone, darunter Liste bereits hochgeladener Seed-Dokumente |
| **Dropzone** | Visuell prominenter Bereich für Drag & Drop. Akzeptiert: `.md`, `.txt`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.pdf` |
| **Upload-Methoden** | Drag & Drop auf Dropzone, Klick auf Dropzone öffnet Dateidialog |
| **Mehrfach-Upload** | Ja – mehrere Dateien gleichzeitig möglich |

#### FR-201: Seed-Dokumente verwalten

| Aspekt | Spezifikation |
|--------|--------------|
| **Anzeige** | Liste aller hochgeladenen Dokumente mit: Dateiname, Typ-Icon, Upload-Datum, Vorschau-Möglichkeit |
| **Vorschau** | Markdown-Dokumente: Gerenderte Vorschau. Bilder: Thumbnail. |
| **Aktionen pro Dokument** | Vorschau anzeigen, Löschen (mit Bestätigungsdialog) |
| **Reihenfolge** | Die Dokumente können per Drag & Drop in der Liste umsortiert werden. Die Reihenfolge beeinflusst die Priorisierung bei der Kontextübergabe an die KI. |

#### FR-202: Seed abschließen und Prozess starten

| Aspekt | Spezifikation |
|--------|--------------|
| **Auslöser** | Nutzer klickt „Prozess starten" / „Plant Seed" |
| **Vorbedingung** | Mindestens ein Seed-Dokument muss hochgeladen sein |
| **Ergebnis** | Prozessstatus wechselt von `seeding` zu `active`. Weiterleitung zur Stage-Übersicht. Der Seed ist ab jetzt nicht mehr veränderbar (Immutable Baseline). |

#### FR-203: Seed-Konsolidierung (optional, Phase 1 des Prozesses)

| Aspekt | Spezifikation |
|--------|--------------|
| **Beschreibung** | Die erste Stage des Prozesses kann eine optionale Konsolidierungs-Stage sein, in der die rohen Seed-Dokumente KI-gestützt zu einem strukturierten Ausgangsdokument zusammengefasst werden. |
| **Mechanismus** | Ein Long-Text-Field mit Standard-Prompt, der alle Seed-Dokumente als Kontext erhält und ein bereinigtes, strukturiertes Markdown-Dokument erzeugt. |
| **Nutzereingriff** | Der Nutzer kann das konsolidierte Dokument manuell nachbearbeiten, bevor es als Basis für alle weiteren Stages dient. |

---

### 4.3 FB3 – Stage-Navigation und -Übersicht

#### FR-300: Stage-Übersicht

| Aspekt | Spezifikation |
|--------|--------------|
| **Darstellung** | Visuelle Darstellung aller Stages als horizontale Timeline oder als vertikale Kartenliste. Jede Stage wird als Karte mit Name, Icon und Statusindikator dargestellt. |
| **Skalierung** | Muss 5–15 Stages übersichtlich darstellen können, ohne zu scrollen (bei horizontaler Timeline ggf. kompakte Darstellung ab >10 Stages). |
| **Statusindikatoren** | `locked` (noch nicht erreichbar – optional, Level 1 vorerst ohne), `open` (bearbeitbar), `in_progress` (mindestens ein Field bearbeitet), `completed` (alle Steps completed) |
| **Navigation** | Klick auf eine Stage-Karte führt zur Stage-Detailansicht |
| **Motivation** | Die Darstellung soll den Fortschritt positiv vermitteln und zum Weiterarbeiten motivieren (z. B. Fortschrittsbalken, Häkchen bei abgeschlossenen Stages). |

#### FR-301: Stage-Fortschrittsberechnung

| Aspekt | Spezifikation |
|--------|--------------|
| **Berechnung** | Fortschritt einer Stage = Anzahl `completed` Steps / Gesamtanzahl Steps (in Prozent) |
| **Anzeige** | Fortschrittsbalken oder Fraktionsanzeige (z. B. „4/7 Steps") auf der Stage-Karte |

#### FR-302: Kontextuelle Navigation

| Aspekt | Spezifikation |
|--------|--------------|
| **Breadcrumb** | Permanente Breadcrumb-Navigation: `Prozessname > Stage-Name > [Step-Name]` |
| **Zurück-Navigation** | Von Stage-Detail zurück zur Stage-Übersicht; von der Stage-Übersicht zurück zum Dashboard. Globaler Dashboard-Link (Logo-Klick) ist von jeder Stelle erreichbar. [UC-06] |
| **Aktuelle Position** | Die aktuelle Stage ist in der Übersicht visuell hervorgehoben (z. B. größere Karte, farblicher Akzent) |
| **URL-Routing** | Jede Stage und jeder Step hat eine eigene URL, sodass Deeplinks und Browser-History korrekt funktionieren. [EA-05] |

#### FR-303: Persistente Stage-Navigation

| Aspekt | Spezifikation |
|--------|--------------|
| **Beschreibung** | Innerhalb eines Prozesses ist die Stage-Navigation **permanent sichtbar** – als kompakte Tab-Leiste oberhalb des Inhaltsbereichs oder als Sidebar. Nicht nur als eigene Seite. [UC-07, EA-07] |
| **Verhalten** | Klick auf eine Stage in der persistenten Navigation wechselt sofort zur Stage-Detailansicht. Die aktuelle Stage ist visuell markiert. Abgeschlossene Stages zeigen ein Häkchen. |
| **Kompaktheit** | Die Navigation nimmt minimal Platz ein und zeigt Stage-Namen + Statusicons. Bei vielen Stages (>10) wird horizontal gescrollt oder ein Overflow-Menü angeboten. |

#### FR-304: Quick-Switcher

| Aspekt | Spezifikation |
|--------|--------------|
| **Auslöser** | `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux) |
| **Verhalten** | Öffnet ein Such-Overlay (Command Palette) über alle Prozesse, Stages und Steps. Tippen filtert in Echtzeit. Enter navigiert direkt zum ausgewählten Element. |
| **Priorisierung** | Zuletzt bearbeitete Elemente werden bevorzugt angezeigt. |
| **Priorität** | SOLL für Level 1, MUSS für Level 2 [UC-06, EA-08] |

---

### 4.4 FB4 – Stage-Detailansicht und Step-/Field-Bearbeitung

#### FR-400: Stage-Detailansicht

| Aspekt | Spezifikation |
|--------|--------------|
| **Layout** | Vertikale Liste aller Steps der Stage. Jeder Step ist ein ausklappbarer Abschnitt (Accordion) oder eine Karte, die alle zugehörigen Fields enthält. |
| **Skalierung** | Muss 1–15 Steps übersichtlich darstellen. Bei vielen Steps: kompakte Darstellung mit Expand/Collapse. |
| **Step-Header** | Name des Steps, Fortschrittsindikator (z. B. „2/4 Fields closed"), Completed-Status |
| **Reihenfolge** | Steps werden in der im Template definierten Reihenfolge angezeigt. Die Bearbeitung ist nicht an diese Reihenfolge gebunden – der Nutzer kann jeden Step jederzeit öffnen und bearbeiten. |

#### FR-401: Step-Ansicht

| Aspekt | Spezifikation |
|--------|--------------|
| **Darstellung** | Beim Aufklappen eines Steps werden alle zugehörigen Fields untereinander angezeigt. |
| **Dependency-Hinweis** | Wenn ein Step Dependencies auf andere Steps hat, wird ein dezenter Hinweis angezeigt: „Basiert auf: [Step-Name]". Falls der referenzierte Step noch nicht abgeschlossen ist, wird ein Warnhinweis gezeigt (nicht blockierend). |
| **Step abschließen** | Automatisch: Sobald alle Fields `closed` sind, wird der Step als `completed` markiert. Es gibt keinen manuellen „Step abschließen"-Button. |

#### FR-402: Field-Darstellung

Jedes Field wird als eigenständige Karte innerhalb eines Steps dargestellt.

| Aspekt | Spezifikation |
|--------|--------------|
| **Grundelemente** | Field-Name (Label), Inhalt (je nach Typ), Status-Rahmen, KI-Aktionsbuttons |
| **Status-Rahmen (Dark Mode)** | `open`: Blauer Rahmen (signalisiert offene Bearbeitung). `closed`: Dunkelgrüner, dezenter Rahmen (vermittelt Abschluss). |
| **Status-Rahmen (Light Mode)** | Analoges Farbschema, an Light Mode angepasst |
| **Dependency-Anzeige** | Wenn das Field Dependencies hat, wird unterhalb des Labels ein dezenter Hinweis angezeigt: „Input von: [Field-Name 1], [Field-Name 2]" |
| **Empty State** | Noch nicht befüllte Fields zeigen einen Platzhaltertext: „Noch kein Inhalt – nutze ‚Generate', um zu starten." |

#### FR-403: Field-Typen und Editoren

| Typ | Editor | Verhalten |
|-----|--------|-----------|
| `text` | Einzeiliges Textfeld | Freitexteingabe, max. 500 Zeichen |
| `long_text` | Markdown-Editor | Rich-Text-Darstellung mit Toolbar (Bold, Italic, Listen, Headings, Code, Links). Intern reines Markdown. Unterstützt Vollbildmodus. |
| `file` | Upload-Bereich | Einzelne Datei hochladen. Anzeige: Dateiname, Typ-Icon, Download-Link. |
| `file_list` | Upload-Bereich (Mehrfach) | Mehrere Dateien hochladen. Anzeige als Liste mit Drag-&-Drop-Sortierung. |
| `task` | Task-Karte (siehe FR-600) | Spezielle Darstellung mit Aufgabenbeschreibung, Assignee, Status-Workflow, Ergebnis. |

#### FR-404: Field schließen und öffnen

| Aspekt | Spezifikation |
|--------|--------------|
| **Schließen** | Der Nutzer kann ein befülltes Field über einen „Abschließen"-Button (Häkchen-Icon) oder per `Cmd+Enter` als `closed` markieren. [UC-04, EA-03] |
| **Vorbedingung** | Das Field muss einen nicht-leeren Inhalt haben. |
| **Wirkung** | Das Field wird read-only. Der Rahmen wechselt zu dunkelgrün/dezent. Die KI-Aktionsbuttons werden ausgeblendet. Dezente, befriedigende Übergangsanimation. |
| **Auto-Scroll** | Nach dem Abschließen scrollt die UI automatisch zum **nächsten offenen Field** (Soft-Scroll, nicht abrupt). Der Cursor/Fokus wird auf dieses Field gesetzt. [UC-04, EA-04] |
| **Wieder öffnen** | Ein geschlossenes Field kann über einen „Wieder öffnen"-Button (Stift-Icon) in den `open`-Zustand zurückversetzt werden. Dadurch wird auch der übergeordnete Step automatisch auf `completed = false` gesetzt. Kein Bestätigungsdialog nötig (Versionshistorie als Safety-Net). [UC-14] |

#### FR-405: Field manuell bearbeiten

| Aspekt | Spezifikation |
|--------|--------------|
| **Beschreibung** | Der Nutzer kann den Inhalt jedes `open`-Fields jederzeit manuell bearbeiten – unabhängig davon, ob der Inhalt KI-generiert oder manuell eingegeben wurde. |
| **Zero-Click-Editing** | Long-Text-Fields sind **direkt editierbar** – ein Klick setzt den Cursor, sofortiges Tippen ist möglich. Kein Edit-Modus, kein Doppelklick, kein Modal zum Bearbeiten. Der Markdown-Editor ist bei offenen Fields immer aktiv. [UC-03, EA-01] |
| **Autosave** | Änderungen werden automatisch gespeichert (Debounce: 2 Sekunden nach letzter Eingabe). |
| **Versionshistorie** | Jede Speicherung erzeugt einen Versionseintrag. Der Nutzer kann über ein Versionsmenü frühere Stände einsehen und wiederherstellen. Die Versionshistorie zeigt eine **Diff-Ansicht** (Unterschied zur aktuellen Version). [UC-09] |
| **KI-Undo** | `Cmd+Z` nach einem Generate/Optimize stellt den vorherigen Feldinhalt sofort wieder her, ohne die Versionshistorie öffnen zu müssen. Dies ist der häufigste Undo-Fall. [UC-09, EA-10] |

---

### 4.5 FB5 – KI-Integration

#### FR-500: KI-Aktion „Generate"

| Aspekt | Spezifikation |
|--------|--------------|
| **Auslöser** | Nutzer klickt den „Generate"-Button (Blitz-Icon) an einem Field |
| **Verhalten** | Die KI generiert den Feldinhalt basierend auf dem Standard-Prompt des Fields. |
| **KI-Kontext** | Der Prompt wird angereichert mit: (1) Seed-Dokumente / konsolidierter Seed, (2) Inhalte aller als Dependency definierten Fields, (3) Inhalte aller abgeschlossenen Fields vorheriger Stages (kontextuelle Kette) |
| **Kontext-Priorisierung** | Bei Konflikten: Neuere Stages überschreiben ältere. Explizite Dependencies haben Vorrang vor implizitem Stage-Kontext. |
| **Ergebnis** | Der generierte Inhalt wird in das Field eingefügt. Bei leerem Field: **kein Bestätigungsdialog** (One-Click-Generate). Bei bereits befülltem Field: Warndialog „Vorhandener Inhalt wird ersetzt. Fortfahren?" [UC-01, EA-02] |
| **Streaming** | Die Generierung wird **inline im Field** als Streaming-Response dargestellt – der Text erscheint schrittweise. Kein blockierendes Modal. Der Nutzer kann während des Streamings bereits weiterlesen. Abbrechen-Button sichtbar. [UC-01] |
| **Nach Streaming** | Fokus bleibt auf dem Field. Cursor am Ende des generierten Textes. [EA-04] |
| **Keyboard-Shortcut** | `Cmd+G` löst Generate auf dem aktuell fokussierten Field aus. [EA-03] |
| **Fehlerfall** | Bei KI-Fehler: Fehlermeldung im Field-Bereich, vorheriger Inhalt bleibt erhalten. Retry-Button. |

#### FR-501: KI-Aktion „Generate Advanced"

| Aspekt | Spezifikation |
|--------|--------------|
| **Auslöser** | Nutzer klickt den „Generate Advanced"-Button (Blitz-Plus-Icon) an einem Field |
| **Modal** | Es öffnet sich ein Modal mit: |
| | **1. Standard-Prompt** (mehrzeiliges Textfeld, initial read-only, editierbar via Stift-Icon). Zeigt den vollständigen Standard-Prompt des Fields. |
| | **2. Zusatzanweisungen** (leeres mehrzeiliges Textfeld, Placeholder: „z. B. ‚Schwerpunkt auf Internationalität', ‚Bitte kurz halten'"). |
| | **3. Buttons:** „Generieren" (Primary), „Abbrechen" (Secondary) |
| **Verhalten bei Generierung** | Der zusammengesetzte Prompt = Standard-Prompt + Zusatzanweisungen wird verwendet. Gleicher Kontext wie bei FR-500. |
| **Auto-Focus** | Beim Öffnen des Modals liegt der Fokus auf dem **Zusatzanweisungen-Feld** (nicht auf dem Standard-Prompt – den will man meistens nicht anfassen). [UC-08, EA-04] |
| **Keyboard-Shortcut** | `Cmd+Shift+G` öffnet das Generate-Advanced-Modal auf dem fokussierten Field. `Cmd+Enter` im Modal startet die Generierung. [EA-03] |
| **Vorschläge** | Unterhalb des Zusatzanweisungen-Feldes werden die **zuletzt verwendeten Anweisungen** als anklickbare Chips angezeigt (z. B. „Fokus auf DACH-Markt", „Bitte kurz halten"). [UC-08] |
| **Prompt-Persistenz** | Änderungen am Standard-Prompt im Modal sind **temporär** (nur für diesen einen Durchlauf). Der Standard-Prompt im Template bleibt unverändert. Zusatzanweisungen werden **nicht** dauerhaft gespeichert (aber in der Vorschlagsliste gemerkt). |
| **Ergebnis** | Wie FR-500 – Inhalt wird in das Field eingefügt. |

#### FR-502: KI-Aktion „Optimize"

| Aspekt | Spezifikation |
|--------|--------------|
| **Auslöser** | Nutzer klickt den „Optimize"-Button (Schraubenschlüssel-Icon) an einem Field |
| **Vorbedingung** | Das Field muss bereits Inhalt haben. Button ist nur bei nicht-leerem Field aktiv. |
| **Modal** | Es öffnet sich ein Modal mit: |
| | **1. Aktueller Feldinhalt** (read-only Vorschau, scrollbar) |
| | **2. Optimierungsanweisung** (leeres mehrzeiliges Textfeld, Placeholder: „z. B. ‚Fasse kürzer zusammen', ‚Ergänze quantitative Daten', ‚Formuliere formeller'") |
| | **3. Buttons:** „Optimieren" (Primary), „Abbrechen" (Secondary) |
| **Auto-Focus** | Beim Öffnen des Modals liegt der Fokus auf dem **Optimierungsanweisung-Feld**. [EA-04] |
| **Quick-Action-Chips** | Oberhalb des Anweisungsfeldes werden häufige Optimierungen als anklickbare Chips angeboten: „Kürzer fassen", „Formeller", „Mit konkreten Zahlen", „Einfacher formulieren", „Bullet Points". Klick füllt das Anweisungsfeld. [UC-02, EA-06] |
| **Keyboard-Shortcut** | `Cmd+Enter` im Modal startet die Optimierung. [EA-03] |
| **KI-Kontext** | Die KI erhält: (1) den aktuellen Feldinhalt, (2) die Optimierungsanweisung, (3) die Inhalte aller Dependency-Fields |
| **Ergebnis** | Der optimierte Inhalt **ersetzt** den bisherigen Feldinhalt. Der vorherige Inhalt wird in der Versionshistorie gespeichert. |

#### FR-503: KI-Kontext-Assembly

| Aspekt | Spezifikation |
|--------|--------------|
| **Beschreibung** | Für jeden KI-Aufruf (Generate, Generate Advanced, Optimize) wird automatisch ein Kontextpaket zusammengestellt. |
| **Zusammensetzungsregel** | 1. **Seed:** Konsolidierter Seed (falls vorhanden), sonst alle Seed-Dokumente. 2. **Explizite Dependencies:** Inhalte aller im Dependency Graph referenzierten Fields (direkte + transitive). 3. **Stage-Kontext:** Zusammenfassung abgeschlossener vorheriger Stages. |
| **Kontextfenster-Strategie** | Bei Überschreitung des Kontextlimits: (1) Explizite Dependencies haben immer Vorrang. (2) Ältere Stages werden zusammengefasst. (3) Seed-Dokumente werden gekürzt (Zusammenfassung). |
| **Transparenz** | Im „Generate Advanced"-Modal wird die Größe des zusammengestellten Kontexts angezeigt (z. B. „~4.200 Tokens Kontext"). |

#### FR-504: Quelldokument-Korrektur

| Aspekt | Spezifikation |
|--------|--------------|
| **Beschreibung** | In der Konsolidierungs-Stage (erste Stage) kann der Nutzer KI-gestützt das Quelldokument korrigieren und bereinigen. |
| **Mechanismus** | Der Nutzer gibt im Optimize-Modal Anweisungen wie „Entferne den Abschnitt über XY" oder „Korrigiere die Terminologie: ersetze ‚Phase' durch ‚Step'". Die KI führt die Korrekturen am konsolidierten Seed durch. |
| **Wirkung** | Das bereinigte Dokument wird zur neuen Baseline für alle nachfolgenden Stages. |

---

### 4.6 FB6 – Dependency Management

#### FR-600: Field-Level Dependencies

| Aspekt | Spezifikation |
|--------|--------------|
| **Definition** | Dependencies werden im Prozessmodell-Template definiert. Jedes Field kann eine Liste von Field-Referenzen als Dependencies angeben. |
| **Scope** | Dependencies können innerhalb eines Steps (Field → Field) und über Step-Grenzen innerhalb einer Stage (Field in Step A → Field in Step B) referenzieren. |
| **Visualisierung** | Unterhalb des Field-Labels wird ein dezenter Hinweis angezeigt: „Nutzt Input von: [Field-Name] (Step-Name)". Klick auf den Hinweis scrollt zum referenzierten Field. [UC-10] |
| **Hover-Preview** | Beim Hovern über einen Dependency-Hinweis zeigt ein **Popover** den Inhalt des referenzierten Fields (erste ~200 Zeichen als Markdown-Vorschau). So kann der Nutzer den Input prüfen, ohne zu navigieren. [UC-10, EA-09] |
| **KI-Nutzung** | Bei Generate/Optimize wird der Inhalt aller referenzierten Fields automatisch in den KI-Kontext aufgenommen. |

#### FR-601: Step-Level Dependencies

| Aspekt | Spezifikation |
|--------|--------------|
| **Definition** | Steps können Dependencies auf andere Steps innerhalb derselben Stage haben. |
| **Verhalten (Level 1 – kurzfristig)** | Freie Bearbeitung aller Steps. Wenn ein Step Dependencies auf einen nicht-abgeschlossenen Step hat, wird ein **Warnhinweis** angezeigt: „Hinweis: Step ‚[Name]' ist noch nicht abgeschlossen. Die Ergebnisse dieses Steps könnten dadurch unvollständig sein." Der Nutzer kann trotzdem arbeiten. |
| **Verhalten (Roadmap – langfristig)** | Optional: Mandatory Dependencies deaktivieren abhängige Steps/Fields, bis der Vorläufer `completed` ist. |

#### FR-602: Stage-übergreifender Kontext

| Aspekt | Spezifikation |
|--------|--------------|
| **Beschreibung** | Jede Stage hat impliziten Zugriff auf alle Ergebnisse vorheriger Stages. Dies ist kein expliziter Dependency Graph, sondern ein automatischer Kontextmechanismus. |
| **Regel** | Neuere Stage-Ergebnisse überschreiben ältere bei Widersprüchen. |
| **Umsetzung** | Beim KI-Aufruf werden die Ergebnisse vorheriger Stages als Hintergrundkontext mitgegeben (nach expliziten Dependencies, mit niedrigerer Priorität). |

---

### 4.7 FB7 – Aufgabenmanagement (Tasks)

#### FR-700: Task-Field Darstellung

| Aspekt | Spezifikation |
|--------|--------------|
| **Layout** | Ein Task-Field wird als spezielle Karte dargestellt, die sich visuell von Text-Fields unterscheidet (z. B. andere Hintergrundfarbe, Task-Icon). |
| **Elemente** | Taskbeschreibung (Markdown, editierbar), Assignee-Feld, Typ-Auswahl, Status-Indikator, Ergebnis-Feld (Markdown) |

#### FR-701: Task-Erstellung

| Aspekt | Spezifikation |
|--------|--------------|
| **Taskbeschreibung** | Kann manuell eingegeben oder per KI (Generate/Generate Advanced) erzeugt werden. Beispiel: Die KI generiert eine detaillierte Arbeitsanweisung für „Account anmelden". |
| **Assignee** | Freitext-Feld für den Namen der zuständigen Person. **Autocomplete**: Bereits verwendete Assignee-Namen werden als Vorschläge angeboten. [UC-12, EA-09] |
| **Typ-Auswahl** | Dropdown: `Self-assigned` (Standard), `Delegated`, `Agent` (in Level 1 deaktiviert, ausgegraut mit Hinweis „Coming soon"). Wenn ein Assignee gesetzt wird (und nicht der eigene Name ist), wechselt der Typ automatisch zu `Delegated`. [UC-12] |

#### FR-702: Task-Status-Workflow

```
planned ──> delegated ──> in_progress ──> done ──> accepted
   │                                                   │
   └──────── (bei self-assigned: direkt) ──────────────┘
                                                       │
                                                  Field = closed
```

| Übergang | Auslöser | Beschreibung |
|----------|----------|-------------|
| `planned` → `delegated` | Nutzer setzt Assignee und klickt „Delegieren" | Aufgabe ist zugewiesen, wartet auf Bearbeitung |
| `planned` → `in_progress` | Nutzer klickt „Starten" (bei self-assigned) | Nutzer beginnt selbst mit der Bearbeitung |
| `delegated` → `in_progress` | Nutzer klickt „In Bearbeitung setzen" | Signalisiert, dass der Assignee begonnen hat |
| `in_progress` → `done` | Nutzer trägt Ergebnis ein und klickt „Erledigt" | Ergebnis liegt vor, wartet auf Abnahme |
| `done` → `accepted` | Nutzer prüft Ergebnis und klickt „Abnehmen" | Aufgabe ist final abgeschlossen |
| `accepted` → Field `closed` | Automatisch | Task-Abnahme setzt das zugehörige Field auf `closed` |

#### FR-703: Task-Ergebnis

| Aspekt | Spezifikation |
|--------|--------------|
| **Eingabe** | Markdown-Editor für das Ergebnis/den Nachweis |
| **KI-Unterstützung** | Das Ergebnis-Feld hat ebenfalls Generate/Optimize-Buttons (z. B. um eine Vorlage für den Ergebnisbericht zu generieren) |
| **Vorbedingung für „Erledigt"** | Das Ergebnis-Feld muss befüllt sein, bevor der Status auf `done` gesetzt werden kann |

---

### 4.8 FB8 – Status- und Fortschrittsverfolgung

#### FR-800: Status-Kaskade

| Ebene | Regel | Trigger |
|-------|-------|---------|
| **Field** | `closed = true` wenn manuell geschlossen oder Task `accepted` | Nutzeraktion |
| **Step** | `completed = true` wenn alle Fields `closed` | Automatisch (berechnet) |
| **Stage** | `completed = true` wenn alle Steps `completed` | Automatisch (berechnet) |
| **Prozess** | `status = completed` wenn alle Stages `completed` | Automatisch (berechnet) |

#### FR-801: Rückwärts-Propagation

| Aspekt | Spezifikation |
|--------|--------------|
| **Beschreibung** | Wird ein geschlossenes Field wieder geöffnet (FR-404), werden die übergeordneten Status zurückgesetzt: Step → `completed = false`, Stage → `completed = false`, Prozess → `status = active`. |

#### FR-802: Gesamtfortschritt

| Aspekt | Spezifikation |
|--------|--------------|
| **Berechnung** | Gesamt-Fortschritt = Summe aller `closed` Fields / Summe aller Fields (über alle Stages) |
| **Darstellung** | Im Prozess-Header als Fortschrittsbalken und Prozentwert |

---

## 5. UI/UX-Spezifikation

### 5.1 Screens und Navigationsstruktur

```
┌──────────────────────────────────────────────────────┐
│  Dashboard (FR-100)                                  │
│  └── Prozessinstanz                                  │
│       ├── Seeding-View (FR-200)                      │
│       ├── Stage-Übersicht (FR-300)                   │
│       └── Stage-Detail (FR-400)                      │
│            └── Step-Ansicht (FR-401)                 │
│                 └── Field-Bearbeitung (FR-402–405)   │
│                      ├── Generate-Modal (FR-500)     │
│                      ├── Advanced-Modal (FR-501)     │
│                      └── Optimize-Modal (FR-502)     │
└──────────────────────────────────────────────────────┘
```

### 5.2 Screen-Beschreibungen

#### S1: Dashboard

- **Zugang:** Startseite der Anwendung
- **Inhalt:** Kacheln/Karten für alle Prozessinstanzen + „Neuer Prozess"-Karte
- **Leerzustand:** Motivierender Empty-State mit Illustration: „Noch keine Ideen? Starte deinen ersten Prozess!"

#### S2: Seeding-View

- **Zugang:** Nach Prozess-Erstellung oder Klick auf Prozess im Status `seeding`
- **Layout:** Oben: Prozessname + Prozessmodell-Info. Mitte: Dropzone (groß, visuell einladend). Unten: Dokumentenliste mit Vorschau. Footer: „Plant Seed"-Button (Primary, prominent)
- **Visuelles Konzept:** Pflanzenmetapher – die Dropzone könnte wie ein Blumentopf/Erdschicht gestaltet sein, in den Dokumente „eingepflanzt" werden.

#### S3: Stage-Übersicht

- **Zugang:** Nach Seeding oder über Breadcrumb
- **Layout:** Horizontale Timeline mit Stage-Karten. Aktuelle Stage hervorgehoben. Abgeschlossene Stages mit Häkchen/grünem Akzent. Zukünftige Stages dezent/ausgegraut.
- **Interaktion:** Klick auf Stage → Stage-Detail. Hover zeigt Tooltip mit Stage-Beschreibung und Fortschritt.

#### S4: Stage-Detail

- **Zugang:** Klick auf Stage in der Übersicht
- **Layout:** Header mit Stage-Name, Icon, Fortschrittsbalken. Darunter: Accordion-Liste der Steps. Jeder Step aufklappbar.
- **Interaktion:** Steps können in beliebiger Reihenfolge geöffnet und bearbeitet werden.

#### S5: Generate-Advanced-Modal

- **Layout:** Overlay-Modal (max. 800px breit). Oberer Bereich: Standard-Prompt in Read-Only-Textbox mit Stift-Icon zum Editieren. Mittlerer Bereich: Zusatzanweisungen-Textfeld. Unterer Bereich: „Generieren"-Button (Primary) + „Abbrechen"-Button.
- **Verhalten:** Escape oder Klick außerhalb schließt das Modal.

#### S6: Optimize-Modal

- **Layout:** Overlay-Modal. Oberer Bereich: Aktueller Feldinhalt (Markdown gerendert, scrollbar, read-only). Mittlerer Bereich: Optimierungsanweisung-Textfeld. Unterer Bereich: „Optimieren"-Button + „Abbrechen"-Button.

### 5.3 Designsystem-Grundlagen

| Aspekt | Spezifikation |
|--------|--------------|
| **Farbmodus** | Dark Mode als primärer Modus, Light Mode als Alternative |
| **Field-Status-Farben** | Open: `#3B82F6` (Blue-500), Closed: `#065F46` (Emerald-800, dezent) |
| **Typografie** | Serifenlose Systemschrift. Markdown-Editoren: Monospace für Code, proportional für Fließtext. |
| **Spacing** | Großzügiger Whitespace zwischen Steps und Fields für visuelle Klarheit |
| **Iconografie** | Konsistentes Icon-Set. Stages und Steps erhalten individuelle Icons zur schnellen visuellen Zuordnung. |
| **Responsivität** | Desktop-first. Tablet-Unterstützung als Stretch-Goal. Mobile: nur Dashboard und Stage-Übersicht lesbar. |

### 5.4 Keyboard-Shortcuts

> Abgeleitet aus den Effizienz-Anforderungen EA-03 (Keyboard-First für den Kern-Loop). [UC-01–UC-04]

| Shortcut | Kontext | Aktion |
|----------|---------|--------|
| `Cmd+Enter` | Field fokussiert | Field abschließen + Auto-Scroll zum nächsten offenen Field |
| `Cmd+Enter` | In Modal (Generate Advanced / Optimize) | Hauptaktion auslösen (Generieren / Optimieren) |
| `Cmd+G` | Field fokussiert | Generate auf aktuellem Field |
| `Cmd+Shift+G` | Field fokussiert | Generate Advanced Modal öffnen |
| `Cmd+Z` | Field fokussiert (nach KI-Aktion) | Letzten KI-Generate/Optimize rückgängig machen |
| `Cmd+K` | Global | Quick-Switcher öffnen (Suche über Prozesse/Stages/Steps) |
| `Escape` | In Modal | Modal schließen |
| `Tab` | Step-Ansicht | Zum nächsten Field wechseln |

**Hinweis:** Auf Windows/Linux wird `Cmd` durch `Ctrl` ersetzt.

### 5.5 KI-Aktionsbuttons – Platzierung und Verhalten

| Button | Icon | Platzierung | Zustand |
|--------|------|-------------|---------|
| **Generate** | Blitz | Rechts oben im Field-Header | Immer sichtbar bei `open`-Fields |
| **Generate Advanced** | Blitz + Plus | Neben Generate | Immer sichtbar bei `open`-Fields |
| **Optimize** | Schraubenschlüssel | Neben Generate Advanced | Nur aktiv bei nicht-leerem Field |
| **Abschließen** | Häkchen | Rechts im Field-Footer | Nur aktiv bei nicht-leerem Field |
| **Wieder öffnen** | Stift | Rechts im Field-Header | Nur sichtbar bei `closed`-Fields |

---

## 6. Geschäftsregeln

### 6.1 Statusregeln

| ID | Regel |
|----|-------|
| BR-01 | Ein Field kann nur `closed` werden, wenn es nicht-leeren Inhalt hat. |
| BR-02 | Ein Task-Field kann nur `closed` werden, wenn sein Status `accepted` ist. |
| BR-03 | Ein Step ist `completed`, wenn und nur wenn alle seine Fields `closed` sind. |
| BR-04 | Eine Stage ist `completed`, wenn und nur wenn alle ihre Steps `completed` sind. |
| BR-05 | Ein Prozess ist `completed`, wenn und nur wenn alle seine Stages `completed` sind. |
| BR-06 | Das Wieder-Öffnen eines Fields setzt die Status-Kaskade rückwärts zurück (Step, Stage, Prozess). |

### 6.2 Seed-Regeln

| ID | Regel |
|----|-------|
| BR-10 | Ein Prozess kann nur aus dem Status `seeding` in `active` wechseln, wenn mindestens ein Seed-Dokument existiert. |
| BR-11 | Nach dem Status-Wechsel zu `active` ist der Seed immutable. Änderungen am Quellmaterial erfolgen über die Konsolidierungs-Stage. |
| BR-12 | Die Reihenfolge der Seed-Dokumente beeinflusst die Priorisierung im KI-Kontext. |

### 6.3 KI-Regeln

| ID | Regel |
|----|-------|
| BR-20 | Jeder KI-Aufruf enthält mindestens den Seed als Kontext (sofern vorhanden). |
| BR-21 | Explizite Field-Dependencies haben bei der Kontext-Assembly immer Vorrang vor implizitem Stage-Kontext. |
| BR-22 | Neuere Stage-Ergebnisse überschreiben ältere bei inhaltlichen Widersprüchen. |
| BR-23 | Änderungen am Standard-Prompt über „Generate Advanced" sind immer temporär und werden nicht persistiert. |
| BR-24 | Ein Generate-Aufruf auf ein bereits befülltes Field erfordert eine Bestätigung des Nutzers. |

### 6.4 Dependency-Regeln

| ID | Regel |
|----|-------|
| BR-30 | Field-Dependencies können nur innerhalb derselben Stage definiert werden (Field → Field, Step → Step). |
| BR-31 | Zirkuläre Dependencies sind nicht erlaubt und müssen bei der Template-Definition validiert werden. |
| BR-32 | Das Bearbeiten eines Fields, dessen Dependencies noch nicht `closed` sind, erzeugt einen Warnhinweis, blockiert die Bearbeitung aber nicht (Level 1). |

---

## 7. Vordefiniertes Prozessmodell: „Geschäftsidee realisieren"

Dieses Prozessmodell wird in Level 1 als festes Template ausgeliefert.

### Stage 1: Der Funke

> Die rohe Idee wird erfasst und konsolidiert.

| Step | Fields | Beschreibung |
|------|--------|-------------|
| **Seed konsolidieren** | `Konsolidiertes Quelldokument` (Long-Text, KI-Prompt: Strukturiere und bereinige die Eingangsdokumente) | Zusammenführung und Bereinigung aller Seed-Dokumente zu einem strukturierten Ausgangsdokument |

### Stage 2: Die Vision

> Die Idee wird aus verschiedenen Perspektiven betrachtet, um ein umfassendes Gefühl zu entwickeln.

| Step | Fields | Beschreibung |
|------|--------|-------------|
| **Visionsbeschreibung** | `Vision Statement` (Long-Text), `Elevator Pitch` (Text) | Formulierung der übergeordneten Vision und eines kompakten Elevator Pitchs |
| **Namensgebung** | `Projektname` (Text), `Namensalternativen` (Long-Text, KI) | Namensfindung und -bewertung |
| **Einordnung** | `Domäne` (Text, KI: Hauptdomäne identifizieren), `Horizontdimension` (Text: Woche/Monat/Jahr/Jahrzehnt), `Priorität` (Text: Hoch/Mittel/Niedrig) | Zeitliche und thematische Verortung der Idee |

### Stage 3: Research & Segmentierung

> Erste systematische Analyse des Umfelds.

| Step | Fields | Beschreibung |
|------|--------|-------------|
| **Thematische Gliederung** | `Themenfelder` (Long-Text, KI) | Zerlegung der Idee in thematische Teilbereiche |
| **Zielgruppenanalyse** | `Primäre Zielgruppe` (Long-Text, KI), `Sekundäre Zielgruppen` (Long-Text, KI) | Identifikation und Beschreibung der Zielgruppen |
| **Marktrecherche** | `Marktüberblick` (Long-Text, KI), `Relevante Quellen` (Long-Text) | Erste Markteinschätzung und Quellensammlung |

### Stage 4: SWOT-Analyse

> Systematische Analyse von Stärken, Schwächen, Chancen und Risiken.

| Step | Fields | Beschreibung |
|------|--------|-------------|
| **Stärken (Strengths)** | `Stärken-Analyse` (Long-Text, KI, Dep: Vision + Research) | Interne Stärken identifizieren |
| **Schwächen (Weaknesses)** | `Schwächen-Analyse` (Long-Text, KI, Dep: Vision + Research) | Interne Schwächen identifizieren |
| **Chancen (Opportunities)** | `Chancen-Analyse` (Long-Text, KI, Dep: Marktrecherche) | Externe Chancen identifizieren |
| **Risiken (Threats)** | `Risiken-Analyse` (Long-Text, KI, Dep: Marktrecherche) | Externe Risiken identifizieren |
| **SWOT-Synthese** | `SWOT-Matrix` (Long-Text, KI, Dep: alle 4 Analysen), `Strategische Implikationen` (Long-Text, KI) | Zusammenführung und strategische Ableitung |

### Stage 5: Businessplan

> Umfassende Ausarbeitung aller geschäftsrelevanten Aspekte.

| Step | Fields | Beschreibung |
|------|--------|-------------|
| **Geschäftsmodell** | `Business Model Canvas` (Long-Text, KI), `Wertversprechen` (Long-Text, KI) | Kernstruktur des Geschäftsmodells |
| **Wettbewerbsanalyse** | `Wettbewerberliste` (Long-Text, KI), `Detailanalyse` (Long-Text, KI, Dep: Wettbewerberliste), `Bewertung Wettbewerbsumfeld` (Long-Text, KI, Dep: Detailanalyse), `Zusammenfassung` (Long-Text, KI, Dep: Bewertung) | Vierstufige Wettbewerbsanalyse-Chain |
| **Finanzplanung** | `Kostenstruktur` (Long-Text, KI), `Erlösmodell` (Long-Text, KI), `Pricing-Strategie` (Long-Text, KI, Dep: Wettbewerbsanalyse) | Finanzielle Eckpfeiler |
| **Rechtliche Aspekte** | `Regulatorische Anforderungen` (Long-Text, KI), `Rechtsform-Empfehlung` (Long-Text, KI) | Juristische Rahmenbedingungen |

### Stage 6: Maßnahmenplan

> Überführung der Analyse in konkrete Handlungsschritte.

| Step | Fields | Beschreibung |
|------|--------|-------------|
| **Meilensteinplanung** | `Meilensteine` (Long-Text, KI, Dep: Businessplan) | Definition der zentralen Meilensteine mit Zeithorizont |
| **Aufgabenplanung** | Mehrere `Task`-Fields (KI generiert Aufgabenbeschreibungen) | Konkrete, delegierbare Aufgaben mit Assignees und Deadlines |
| **Ressourcenplanung** | `Benötigte Ressourcen` (Long-Text, KI), `Budgetübersicht` (Long-Text, KI) | Personal, Finanzen, Infrastruktur |

### Stage 7: Umsetzung & Rollout

> Begleitung der konkreten Realisierung.

| Step | Fields | Beschreibung |
|------|--------|-------------|
| **Go/No-Go-Entscheidung** | `Entscheidungsvorlage` (Long-Text, KI, Dep: alle vorherigen Stages), `Entscheidung` (Text) | Finale Bewertung und Entscheidung |
| **Rollout-Plan** | `Rollout-Phasen` (Long-Text, KI), `Kommunikationsplan` (Long-Text, KI) | Konkrete Umsetzungsplanung |
| **Umsetzungsaufgaben** | Mehrere `Task`-Fields | Operative Aufgaben für den Rollout |

---

## 8. Nicht-funktionale Anforderungen

| ID | Kategorie | Anforderung |
|----|-----------|-------------|
| NFR-01 | **Performance** | KI-Generierung startet das Streaming innerhalb von 3 Sekunden nach Auslösung. |
| NFR-02 | **Performance** | Seitenübergänge (Dashboard → Stage-Übersicht → Stage-Detail) laden in unter 1 Sekunde. |
| NFR-03 | **Datensicherheit** | Alle Nutzdaten werden verschlüsselt gespeichert (at rest und in transit). |
| NFR-04 | **Persistenz** | Autosave mit maximal 2 Sekunden Debounce. Kein Datenverlust bei Browser-Absturz durch lokalen Entwurfs-Cache. |
| NFR-05 | **Versionshistorie** | Für jedes Long-Text- und Task-Field werden mindestens die letzten 20 Versionen gespeichert. |
| NFR-06 | **Erweiterbarkeit** | Die Architektur muss die spätere Einführung von benutzerdefinierten Prozessmodellen (Level 2) unterstützen, ohne grundlegende Umbauten zu erfordern. |
| NFR-07 | **KI-Agnostik** | Die KI-Integration wird über eine abstrahierte Schnittstelle realisiert, sodass das LLM-Backend austauschbar ist (z. B. OpenAI, Anthropic, lokale Modelle). |
| NFR-08 | **Barrierefreiheit** | Die Anwendung erfüllt WCAG 2.1 Level AA. Alle interaktiven Elemente sind per Tastatur bedienbar. Screenreader-kompatible Aria-Labels. |
| NFR-09 | **Responsivität** | Desktop-optimiert (ab 1280px Breite). Tablet (ab 768px): vollständig nutzbar. Mobile (< 768px): Dashboard und Stage-Übersicht lesbar, Bearbeitung eingeschränkt. |

---

## 9. Offene Designentscheidungen

Die folgenden Punkte sind als Entscheidungspunkte identifiziert und müssen vor oder während der Implementierung geklärt werden.

| ID | Thema | Optionen | Empfehlung |
|----|-------|----------|------------|
| OD-01 | **Sibling-Kontext** | A) Alle Sibling-Fields automatisch als Kontext. B) Nur explizit definierte Dependencies als Kontext. | Option B für Level 1 (explizit), da vorhersagbarer und sparsamer im Tokenverbrauch. |
| OD-02 | **Step-Reihenfolge** | A) Komplett frei. B) Empfohlene Reihenfolge mit Hinweisen. C) Erzwungene Reihenfolge bei Dependencies. | Option B für Level 1 (frei mit Hinweisen). |
| OD-03 | **Naming: „Step"** | A) Step (aktuell). B) Baustein. C) Aktion. | Empfehlung: „Step" beibehalten – international verständlich, etablierter Begriff. |
| OD-04 | **Naming: Konsolidierungs-Stage** | A) Seed konsolidieren. B) Foundation. C) Der Funke (aktuell). | Empfehlung: „Der Funke" als Stage-Name, „Seed konsolidieren" als Step-Name innerhalb der Stage. |
| OD-05 | **Wettbewerber-Granularität** | A) Ein großes Markdown-Feld pro Analyseschritt. B) Eigene Item-Liste mit je einem Eintrag pro Wettbewerber. | Option A für Level 1 (einfacher). Option B für Level 2 als strukturierter Datentyp. |
| OD-06 | **Kontextfenster-Überlauf** | A) Automatische Zusammenfassung älterer Stages. B) Nutzer wählt manuell relevanten Kontext. C) Priorisierung nach Dependency-Nähe. | Option C mit Fallback auf A. |
| OD-07 | **Technologie-Stack** | Entschieden: Next.js 15, TypeScript, shadcn/ui, TipTap, PostgreSQL, Vercel AI SDK, Docker. | Siehe `05 Non-Functional Requirements/nonfunctional_requirements.md`, Abschnitt 2. |

---

## 10. Glossar

| Begriff | Definition |
|---------|-----------|
| **Prozessmodell** | Template-Definition eines wiederholbaren Ablaufs mit Stages, Steps und Fields. In Level 1 fest vordefiniert. |
| **Prozessinstanz** | Konkrete Durchführung eines Prozessmodells für eine spezifische Geschäftsidee. |
| **Seed** | Sammlung von Ausgangsmaterialien (Dokumente, Bilder), die den Startpunkt eines Prozesses bilden. |
| **Stage** | Hauptentwicklungsstufe innerhalb eines Prozesses (z. B. Vision, SWOT-Analyse, Businessplan). |
| **Step** | Konkreter Arbeitsschritt innerhalb einer Stage (z. B. Wettbewerbsanalyse). |
| **Field** | Atomares Inhaltselement innerhalb eines Steps. Kann Text, Markdown, Dateien oder Tasks enthalten. |
| **Dependency** | Explizite Referenz eines Fields/Steps auf ein anderes Field/Step, dessen Inhalt als Input dient. |
| **Dependency Graph** | Gerichteter, azyklischer Graph aller Abhängigkeiten zwischen Fields und Steps. |
| **Status-Kaskade** | Automatische Fortschrittspropagation: Fields → Steps → Stages → Prozess. |
| **Generate** | KI-Aktion: Erzeugt Feldinhalt basierend auf Standard-Prompt und Kontext. |
| **Generate Advanced** | KI-Aktion: Wie Generate, aber mit anpassbarem Prompt und Zusatzanweisungen. |
| **Optimize** | KI-Aktion: Überarbeitet bestehenden Feldinhalt basierend auf einer Verbesserungsanweisung. |
| **Chain** | Verkettung von Fields/Steps über Dependencies, bei der der Output eines Elements zum Input des nächsten wird. |
| **Kontext-Assembly** | Automatische Zusammenstellung aller relevanten Inhalte für einen KI-Aufruf. |
