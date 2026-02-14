# Volve – Use Cases & User Journeys

> **Version:** 1.0  
> **Datum:** 2026-02-14  
> **Scope:** Level 1 – Ein Akteur, Business-Development-Prozess  
> **Zweck:** Dieses Dokument definiert die tatsächlichen Nutzungsmuster, Frequenzen und Effizienzanforderungen. Es bildet die Grundlage für die Functional Requirements und stellt sicher, dass hochfrequente Aktionen mit minimalem Aufwand durchführbar sind.

---

## 1. Akteur-Definition

### Primärakteur: Der Ideenentwickler

Es gibt genau **einen Primärakteur**. Diese Person:

- hat ständig neue Geschäftsideen (mehrmals täglich)
- will viele Ideen **parallel** entwickeln und reifen lassen
- arbeitet im Alltag in kurzen, fokussierten Sprints an einzelnen Fields/Steps
- nutzt KI als Beschleuniger, nicht als Ersatz für eigenes Denken
- delegiert einzelne Aufgaben an Mitarbeiter/Dienstleister
- will jederzeit den Überblick über alle laufenden Prozesse behalten
- legt in Level 2 auch eigene Prozessmodelle an (Meta-Prozesse)

### Rollen-Hüte des Akteurs

Der Akteur wechselt situativ zwischen verschiedenen Rollen:

| Hut | Tätigkeit | Frequenz |
|-----|-----------|----------|
| **Ideengeber** | Neue Ideen einspielen, Seed hochladen | Mehrmals täglich |
| **Entwickler** | An Fields arbeiten, KI nutzen, Inhalte verfeinern | Kernaktivität, stundenlang am Tag |
| **Reviewer** | KI-Ergebnisse prüfen, annehmen oder nachsteuern | Bei jeder KI-Nutzung |
| **Stratege** | Überblick verschaffen, Prioritäten setzen, zwischen Ideen wechseln | Mehrmals täglich |
| **Delegierer** | Tasks erstellen und zuweisen | Wöchentlich |
| **Abnehmer** | Task-Ergebnisse prüfen und akzeptieren | Wöchentlich |

---

## 2. Frequenzklassen

Die Use Cases sind nach Nutzungsfrequenz geordnet. **Hochfrequente Aktionen müssen maximal effizient sein** -- jeder unnötige Klick multipliziert sich über den Tag.

| Klasse | Frequenz | Effizienz-Anforderung |
|--------|----------|-----------------------|
| **Kern-Loop** | 30–100× pro Tag | Max. 1–2 Klicks / unter 5 Sekunden |
| **Häufig** | 5–20× pro Tag | Max. 3–4 Klicks / unter 30 Sekunden |
| **Regelmäßig** | 1–5× pro Tag | Max. 5–6 Klicks / unter 1 Minute |
| **Gelegentlich** | Wenige Male pro Woche | Max. 8 Klicks / unter 2 Minuten |
| **Selten** | 1× pro Prozess | Darf komplexer sein / unter 5 Minuten |

---

## 3. Use Cases

### 3.1 Kern-Loop: Field bearbeiten und KI nutzen

> **Das ist die zentrale Aktion der gesamten Applikation.** Der Nutzer verbringt 80% seiner Zeit in diesem Loop.

---

#### UC-01: KI-Inhalt für ein Field generieren (Standard)

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Kern-Loop** – 30–50× pro Tag |
| **Auslöser** | Nutzer ist in einem offenen Field und will KI-generierten Inhalt |
| **Klick-Budget** | **1 Klick** (Generate-Button) |
| **Zeitbudget** | < 5 Sekunden bis erstes Streaming sichtbar |

**Journey:**

```
Field sehen → [Generate] klicken → Streaming beobachten → Ergebnis lesen → fertig
     0s            0,5s                  1-3s                5-30s
```

**Effizienz-Anforderung:**
- Der Generate-Button muss **sofort sichtbar** sein, ohne Scrollen oder Aufklappen.
- Kein Bestätigungsdialog bei leerem Field. Nur bei bereits befülltem Field: Warnung.
- Während des Streamings kann der Nutzer bereits **weiterlesen** (kein blockierendes Modal).

---

#### UC-02: KI-Ergebnis optimieren / nachsteuern

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Kern-Loop** – 20–40× pro Tag (folgt oft auf UC-01) |
| **Auslöser** | Nutzer liest generiertes Ergebnis und will es verbessern |
| **Klick-Budget** | **2 Klicks** (Optimize → Anweisung tippen → Optimieren) |
| **Zeitbudget** | < 15 Sekunden bis zum Starten der Optimierung |

**Journey:**

```
Ergebnis lesen → „Hmm, zu lang" → [Optimize] → Anweisung tippen → [Optimieren] → Streaming
     0s                                0,5s          3-8s               0,5s         1-3s
```

**Effizienz-Anforderung:**
- Das Optimize-Modal muss **sofort öffnen** (< 200ms).
- Das Anweisungsfeld hat **Auto-Focus** -- Nutzer kann sofort tippen.
- **Enter-Shortcut**: Enter (oder Cmd+Enter) startet die Optimierung, ohne den Button klicken zu müssen.
- Häufige Optimierungen (z. B. „kürzer", „formeller", „mit Zahlen") könnten als **Quick-Action-Chips** angeboten werden.

---

#### UC-03: Field manuell nachbearbeiten

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Kern-Loop** – 20–30× pro Tag |
| **Auslöser** | Nutzer will einen KI-generierten oder eigenen Text anpassen |
| **Klick-Budget** | **0 Klicks** – direkt ins Field klicken und tippen |
| **Zeitbudget** | Sofort editierbar |

**Journey:**

```
In Field klicken → Cursor steht → tippen → Autosave
     0s               0s           ...         2s
```

**Effizienz-Anforderung:**
- **Inline-Editing**: Das Field ist direkt editierbar, ohne „Edit-Button" oder Moduswechsel.
- Der Markdown-Editor ist **immer aktiv** bei offenen Long-Text-Fields.
- **Kein Doppelklick** zum Aktivieren. Ein Klick reicht.

---

#### UC-04: Field abschließen und zum nächsten weitergehen

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Häufig** – 10–20× pro Tag |
| **Auslöser** | Nutzer ist zufrieden mit dem Inhalt eines Fields |
| **Klick-Budget** | **1 Klick** (Abschließen-Button) |
| **Zeitbudget** | < 2 Sekunden, dann nächstes Field im Blick |

**Journey:**

```
Inhalt prüfen → [✓ Abschließen] → Rahmen wird grün → Blick wandert zum nächsten offenen Field
     0s              0,5s               0,3s                        automatisch
```

**Effizienz-Anforderung:**
- Nach dem Abschließen scrollt die UI **automatisch zum nächsten offenen Field** (Soft-Scroll, nicht abrupt).
- Alternativ: Keyboard-Shortcut (z. B. `Cmd+Enter` = Field abschließen + zum nächsten springen).
- Visuelles Feedback: Kurze, befriedigende Animation (dezenter Übergang zu Grün).

---

### 3.2 Häufig: Navigation und Überblick

---

#### UC-05: Überblick verschaffen – „Wo war ich?"

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Häufig** – 5–15× pro Tag (morgens, nach Pausen, beim Wechseln) |
| **Auslöser** | Nutzer öffnet die App oder kehrt nach einer Pause zurück |
| **Klick-Budget** | **0 Klicks** – der Überblick ist sofort sichtbar |
| **Zeitbudget** | < 3 Sekunden bis zur Orientierung |

**Journey:**

```
App öffnen → Dashboard sehen → „Ah, Idee X war bei Stage 4" → Klick → Stage-Detail
    0s           0,5s                    1-2s                      0,5s      0,5s
```

**Effizienz-Anforderung:**
- Das Dashboard zeigt pro Prozess: **Name, aktuelle Stage, Fortschritt, letzte Bearbeitung** -- auf einen Blick.
- Die zuletzt bearbeitete Prozessinstanz ist **visuell hervorgehoben** (z. B. erste Position, leichter Akzent).
- **Deeplink**: Beim Öffnen eines Prozesses landet der Nutzer direkt in der **zuletzt bearbeiteten Stage**, nicht in der Stage-Übersicht.

---

#### UC-06: Zwischen Prozessen / Ideen wechseln

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Häufig** – 5–10× pro Tag |
| **Auslöser** | Nutzer will an einer anderen Idee weiterarbeiten |
| **Klick-Budget** | **2 Klicks** (zurück zum Dashboard + Prozess öffnen) |
| **Zeitbudget** | < 3 Sekunden |

**Journey:**

```
In Prozess A arbeiten → [Dashboard / Logo] → Prozess B klicken → direkt in letzter Stage
         ...                   0,5s                0,5s                    0,5s
```

**Effizienz-Anforderung:**
- **Globale Navigation**: Ein permanenter Weg zurück zum Dashboard (Logo-Klick oder Breadcrumb). Kein mehrstufiges Zurück-Klicken.
- **Quick-Switcher** (Stretch Goal): `Cmd+K` öffnet eine Schnellsuche über alle Prozesse. Tippen + Enter = direkter Sprung.
- Kein Datenverlust beim Wechseln (Autosave ist Voraussetzung).

---

#### UC-07: Innerhalb eines Prozesses zwischen Stages navigieren

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Häufig** – 5–10× pro Tag |
| **Auslöser** | Nutzer will nachschauen, was er in einer früheren Stage geschrieben hat, oder zur nächsten Stage weitergehen |
| **Klick-Budget** | **1 Klick** (Stage-Karte oder Breadcrumb) |
| **Zeitbudget** | < 2 Sekunden |

**Journey:**

```
In Stage 4 arbeiten → „Was stand nochmal in der Vision?" → [Stage 2 klicken] → sofort da
       ...                          0,5s                         0,5s             0,5s
```

**Effizienz-Anforderung:**
- Die Stage-Übersicht muss **innerhalb eines Prozesses immer erreichbar** sein -- nicht nur als eigene Seite, sondern idealerweise als **persistent sichtbare Mini-Navigation** (Sidebar oder Top-Bar mit Stage-Tabs).
- Klick auf eine frühere Stage = **Read-Only-Vorschau** ohne die aktuelle Arbeit zu verlieren (oder: neuer Tab / Side-Panel).

---

### 3.3 Regelmäßig: Inhaltliche Arbeit

---

#### UC-08: Generate Advanced nutzen (mit Zusatzanweisung)

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Regelmäßig** – 3–10× pro Tag |
| **Auslöser** | Nutzer will den Standard-Prompt für dieses eine Mal anpassen |
| **Klick-Budget** | **3 Klicks** (Advanced → tippen → Generieren) |
| **Zeitbudget** | < 20 Sekunden |

**Journey:**

```
[Generate Advanced] → Modal öffnet → Zusatzanweisung tippen → [Generieren] → Streaming im Field
       0,5s               0,3s              5-10s                  0,5s           1-3s
```

**Effizienz-Anforderung:**
- Modal hat **Auto-Focus auf Zusatzanweisungsfeld** (nicht auf den Standard-Prompt -- den will man meistens nicht anfassen).
- **Cmd+Enter** startet die Generierung aus dem Modal.
- Letzte Zusatzanweisungen werden als **Vorschläge** angeboten (zuletzt verwendet: „Bitte kurz halten", „Fokus auf DACH-Markt").

---

#### UC-09: Früheres Ergebnis wiederherstellen (Versionshistorie)

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Regelmäßig** – 1–5× pro Tag |
| **Auslöser** | Nutzer hat per Generate/Optimize einen Inhalt überschrieben und will zurück |
| **Klick-Budget** | **3 Klicks** (Versionsmenü → Version auswählen → Wiederherstellen) |
| **Zeitbudget** | < 15 Sekunden |

**Journey:**

```
„Mist, die vorherige Version war besser" → [Versionen] → Liste sehen → Version wählen → [Wiederherstellen]
                                               0,5s          1s            1s              0,5s
```

**Effizienz-Anforderung:**
- **Diff-Ansicht**: Beim Hovern/Auswählen einer Version wird der Unterschied zur aktuellen Version hervorgehoben.
- **Undo-Shortcut** (`Cmd+Z`): Macht den letzten KI-Generate/Optimize rückgängig, ohne die Versionshistorie öffnen zu müssen. Dies ist der häufigste Anwendungsfall.

---

#### UC-10: Dependency-Ergebnis prüfen bevor man weitermacht

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Regelmäßig** – 3–5× pro Tag |
| **Auslöser** | Nutzer will ein Field bearbeiten, das auf einem anderen aufbaut, und will vorher den Input prüfen |
| **Klick-Budget** | **1 Klick** (Dependency-Link klicken) |
| **Zeitbudget** | < 3 Sekunden |

**Journey:**

```
Field sehen → „Input von: Wettbewerberliste" → [Link klicken] → sofort zum Dependency-Field scrollen
    0s                                                0,5s                    0,5s
```

**Effizienz-Anforderung:**
- Der Dependency-Hinweis ist **klickbar** und scrollt direkt zum referenzierten Field.
- Optional: **Inline-Preview** -- beim Hovern über den Dependency-Hinweis wird eine Vorschau des referenzierten Inhalts angezeigt (Tooltip/Popover), ohne navigieren zu müssen.

---

### 3.4 Gelegentlich: Prozessverwaltung und Tasks

---

#### UC-11: Neue Idee einspielen (Seed hochladen)

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Gelegentlich** – 2–5× pro Woche |
| **Auslöser** | Nutzer hat eine neue Idee (Sprachnotiz, Textskizze) und will sie einspielen |
| **Klick-Budget** | **4 Klicks** (Neuer Prozess → Name → Dateien droppen → Plant Seed) |
| **Zeitbudget** | < 90 Sekunden |

**Journey:**

```
Dashboard → [+ Neuer Prozess] → Name eingeben → Dateien per Drag & Drop → [Plant Seed] → Stage-Übersicht
   0s            0,5s              3-5s                  5-10s                  0,5s           0,5s
```

**Effizienz-Anforderung:**
- **Minimaler Widerstand**: Prozessmodell-Auswahl entfällt in Level 1 (nur ein Modell). Also: Name eingeben + Dateien hochladen + Start. Das wars.
- **Schnelleinstieg**: Wenn nur eine Datei, kann diese direkt per Drag & Drop auf den „Neuer Prozess"-Button gezogen werden → Name-Dialog → sofort fertig.
- **Kein Overthinking**: Der Name kann später geändert werden. Die Hürde muss so niedrig wie möglich sein.

---

#### UC-12: Task an Mitarbeiter delegieren

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Gelegentlich** – 2–5× pro Woche |
| **Auslöser** | Im Maßnahmenplan steht eine Aufgabe, die jemand anderes erledigen soll |
| **Klick-Budget** | **3 Klicks** (Assignee eintragen → Typ wählen → Delegieren) |
| **Zeitbudget** | < 30 Sekunden |

**Journey:**

```
Task-Beschreibung lesen → Assignee-Feld ausfüllen → [Delegieren] → Status wechselt
        0s                      5-10s                    0,5s           automatisch
```

**Effizienz-Anforderung:**
- **Assignee-Autocomplete**: Bereits verwendete Assignee-Namen werden vorgeschlagen.
- Typ-Auswahl „Delegated" ist Standard, wenn ein Assignee gesetzt wird (kein extra Klick).

---

#### UC-13: Task-Ergebnis prüfen und abnehmen

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Gelegentlich** – 2–5× pro Woche |
| **Auslöser** | Ein delegierter Task ist als „done" markiert |
| **Klick-Budget** | **2 Klicks** (Ergebnis lesen → Abnehmen) |
| **Zeitbudget** | < 1 Minute (+ Lesezeit) |

**Journey:**

```
Benachrichtigung / Dashboard-Hinweis → Task öffnen → Ergebnis lesen → [Abnehmen] → Field wird closed
                                          0,5s          10-30s           0,5s         automatisch
```

**Effizienz-Anforderung:**
- **Sichtbarkeit**: Tasks im Status „done" (wartet auf Abnahme) sind im Dashboard oder in der Stage-Übersicht klar hervorgehoben, damit sie nicht übersehen werden.

---

### 3.5 Selten: Einmalige / seltene Aktionen

---

#### UC-14: Geschlossenes Field wieder öffnen

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Selten** – 1–3× pro Woche |
| **Auslöser** | Nutzer merkt, dass ein abgeschlossenes Ergebnis doch noch Überarbeitung braucht |
| **Klick-Budget** | **1 Klick** (Wieder-öffnen-Button) |

**Effizienz-Anforderung:**
- Der Button muss sichtbar sein, aber nicht so prominent, dass er versehentlich geklickt wird (Stift-Icon, dezent).
- **Kein Bestätigungsdialog** nötig (da Versionshistorie als Safety-Net dient).

---

#### UC-15: Prozess archivieren

| Aspekt | Beschreibung |
|--------|-------------|
| **Frequenz** | **Selten** – einige Male pro Monat |
| **Auslöser** | Idee wird verworfen oder ist abgeschlossen |
| **Klick-Budget** | **2 Klicks** (Archivieren + Bestätigung) |

**Effizienz-Anforderung:**
- Bestätigungsdialog, da die Aktion den Prozess aus der Hauptansicht entfernt.
- **Reversibel**: Archivierte Prozesse können reaktiviert werden.

---

## 4. Der typische Arbeitstag (Composite Journey)

So sieht ein typischer Arbeitstag mit Volve aus:

### Morgens: Orientierung und neue Idee (5 Minuten)

```
1. App öffnen → Dashboard zeigt 8 laufende Prozesse        [UC-05, 0 Klicks]
2. „Gestern Abend eine Idee gehabt" → Sprachnotiz-Transkript droppen
   [+ Neuer Prozess] → Name: „KI-Schulungsplattform" → Drop → [Plant Seed]
                                                                [UC-11, 4 Klicks]
3. Zurück zum Dashboard → Idee X war bei Stage 4 → Klick    [UC-06, 2 Klicks]
```

### Vormittags: Fokussiertes Arbeiten an einer Idee (60 Minuten)

```
4. Stage 4 (SWOT) → Step „Stärken" öffnen                   [UC-07, 1 Klick]
5. Field „Stärken-Analyse" → [Generate]                      [UC-01, 1 Klick]
6. Ergebnis lesen... „Zu oberflächlich"
   → [Optimize] → „Tiefergehend, mit konkreten Beispielen aus dem Seed"
                                                              [UC-02, 2 Klicks]
7. Ergebnis lesen... gut. Kleinen Satz manuell ergänzen.     [UC-03, 0 Klicks]
8. [✓ Abschließen] → automatisch zum nächsten Field          [UC-04, 1 Klick]
9. Field „Schwächen-Analyse" → [Generate]                    [UC-01, 1 Klick]
10. Lesen... „Dependency prüfen" → [Link: Vision] → lesen    [UC-10, 1 Klick]
11. Zurück → [Generate Advanced] → „Berücksichtige besonders die fehlende
    Markterfahrung" → [Generieren]                            [UC-08, 3 Klicks]
12. Gut. [✓ Abschließen]                                     [UC-04, 1 Klick]
    ... (Schleife für weitere Fields/Steps)
```

**Kern-Loop pro Field: 2–5 Klicks, 1–3 Minuten.**
**In einer Stunde: ~15–25 Fields bearbeitet.**

### Nachmittags: Wechsel und Tasks (20 Minuten)

```
13. Dashboard → anderer Prozess (Stage 6, Maßnahmenplan)     [UC-06, 2 Klicks]
14. Task „Domain registrieren" → Assignee: „Max" →
    [Delegieren]                                              [UC-12, 3 Klicks]
15. Task „Ergebnis Markenrecherche" steht auf „done"
    → Ergebnis lesen → [Abnehmen]                            [UC-13, 2 Klicks]
```

### Abends: Kurzer Überblick (2 Minuten)

```
16. Dashboard → Fortschritt aller Prozesse checken           [UC-05, 0 Klicks]
    „Idee X: Stage 4 zu 80%, Idee Y: Stage 2 zu 50%"
```

---

## 5. Effizienz-Anforderungen (abgeleitet)

Aus den Journeys ergeben sich folgende übergreifende Effizienz-Anforderungen:

### EA-01: Zero-Friction-Editing

| Anforderung | Beschreibung |
|-------------|-------------|
| **Inline-Editing** | Long-Text-Fields sind direkt editierbar. Kein „Edit-Modus", kein Doppelklick, kein Modal zum Bearbeiten. Klicken = Cursor steht = tippen. |
| **Referenz-FRs** | FR-403, FR-405 |

### EA-02: One-Click-Generate

| Anforderung | Beschreibung |
|-------------|-------------|
| **Sofort-Generate** | Ein einziger Klick auf [Generate] startet die Generierung. Kein Bestätigungsdialog bei leerem Field. Streaming startet inline, kein Modal. |
| **Referenz-FRs** | FR-500 |

### EA-03: Keyboard-First für den Kern-Loop

| Anforderung | Beschreibung |
|-------------|-------------|
| **Shortcuts** | `Cmd+Enter` = Field abschließen + nächstes offenes Field fokussieren. `Cmd+G` = Generate auf aktuellem Field. `Cmd+Shift+G` = Generate Advanced. `Cmd+Z` = Letzten KI-Aufruf rückgängig. `Escape` = Modal schließen. |
| **Referenz-FRs** | FR-404, FR-500, FR-501, FR-502 |

### EA-04: Smart Auto-Focus

| Anforderung | Beschreibung |
|-------------|-------------|
| **Nach Generate** | Nach abgeschlossenem Streaming bleibt der Fokus auf dem Field. Cursor am Ende des Textes. |
| **Nach Abschließen** | Soft-Scroll zum nächsten offenen Field. |
| **In Modals** | Auto-Focus auf das Eingabefeld (Zusatzanweisung / Optimierungsanweisung). |
| **Referenz-FRs** | FR-404, FR-500, FR-501, FR-502 |

### EA-05: Deeplink und Kontext-Erhalt

| Anforderung | Beschreibung |
|-------------|-------------|
| **Letzte Position** | Beim Öffnen eines Prozesses landet der Nutzer in der **zuletzt bearbeiteten Stage**, nicht in der Stage-Übersicht. |
| **Browser-Back** | Funktioniert wie erwartet (Stage-Detail → Stage-Übersicht → Dashboard). |
| **URL-Routing** | Jede Stage und jeder Step hat eine eigene URL, sodass Deeplinks und Browser-History funktionieren. |
| **Referenz-FRs** | FR-300, FR-302 |

### EA-06: Minimize Modal-Friction

| Anforderung | Beschreibung |
|-------------|-------------|
| **Modal-Öffnung** | < 200ms. Keine Lade-Animation. |
| **Enter-to-Submit** | In allen Modals startet `Cmd+Enter` die Hauptaktion (Generieren / Optimieren). |
| **Quick-Action-Chips** | Im Optimize-Modal: Häufige Anweisungen als anklickbare Chips: „Kürzer", „Formeller", „Mit Zahlen", „Einfacher". |
| **Referenz-FRs** | FR-501, FR-502 |

### EA-07: Persistent Stage Navigation

| Anforderung | Beschreibung |
|-------------|-------------|
| **Immer sichtbar** | Innerhalb eines Prozesses ist die Stage-Navigation permanent sichtbar (z. B. als kompakte Tab-Leiste / Sidebar), nicht nur als eigene Seite. |
| **1-Klick-Wechsel** | Klick auf eine Stage in der persistenten Navigation wechselt sofort. |
| **Referenz-FRs** | FR-300, FR-302 |

### EA-08: Quick-Switcher

| Anforderung | Beschreibung |
|-------------|-------------|
| **`Cmd+K` / Global Search** | Öffnet ein Suchfeld über alle Prozesse, Stages und Steps. Tippen filtert in Echtzeit. Enter navigiert direkt. |
| **Priorität** | SOLL (Stretch-Goal für Level 1, MUSS für Level 2) |

### EA-09: Dependency Quick-View

| Anforderung | Beschreibung |
|-------------|-------------|
| **Hover-Preview** | Beim Hovern über einen Dependency-Hinweis zeigt ein Popover den Inhalt des referenzierten Fields (erste ~200 Zeichen). |
| **Klick = Scroll** | Klick auf den Dependency-Hinweis scrollt zum referenzierten Field. |
| **Referenz-FRs** | FR-600, FR-601 |

### EA-10: Undo für KI-Aktionen

| Anforderung | Beschreibung |
|-------------|-------------|
| **Sofort-Undo** | `Cmd+Z` nach einem Generate/Optimize stellt den vorherigen Feldinhalt wieder her, ohne die Versionshistorie öffnen zu müssen. |
| **Referenz-FRs** | FR-405, FR-500, FR-502 |

---

## 6. Use-Case-Diagramm (vereinfacht)

```
                                    ┌─────────────────────┐
                                    │   Ideenentwickler    │
                                    └──────────┬──────────┘
                                               │
                 ┌─────────────────────────────┼─────────────────────────────┐
                 │                             │                             │
    ┌────────────┴────────────┐   ┌────────────┴────────────┐   ┌───────────┴────────────┐
    │     KERN-LOOP           │   │      NAVIGATION         │   │    VERWALTUNG          │
    │  (80% der Nutzung)      │   │                         │   │                        │
    ├─────────────────────────┤   ├─────────────────────────┤   ├────────────────────────┤
    │ UC-01 Generate          │   │ UC-05 Überblick         │   │ UC-11 Neue Idee        │
    │ UC-02 Optimize          │   │ UC-06 Prozess wechseln  │   │ UC-12 Task delegieren  │
    │ UC-03 Manuell bearbeiten│   │ UC-07 Stage navigieren  │   │ UC-13 Task abnehmen    │
    │ UC-04 Field abschließen │   │ UC-10 Dependency prüfen │   │ UC-14 Field öffnen     │
    └─────────────────────────┘   └─────────────────────────┘   │ UC-15 Archivieren      │
                                                                └────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │    ERWEITERT            │
    ├─────────────────────────┤
    │ UC-08 Generate Advanced │
    │ UC-09 Versionshistorie  │
    └─────────────────────────┘
```

---

## 7. Prüfmatrix: Use Cases → Functional Requirements

Diese Matrix stellt sicher, dass jeder Use Case durch mindestens eine Functional Requirement adressiert wird.

| Use Case | Referenzierte FRs | Adressiert? | Lücke / Ergänzungsbedarf |
|----------|-------------------|-------------|--------------------------|
| UC-01 Generate | FR-500 | ✅ Ja | **Ergänzen:** Kein Bestätigungsdialog bei leerem Field. Streaming inline, kein Modal. |
| UC-02 Optimize | FR-502 | ✅ Ja | **Ergänzen:** Auto-Focus, Cmd+Enter, Quick-Action-Chips. |
| UC-03 Manuell bearbeiten | FR-403, FR-405 | ✅ Ja | **Ergänzen:** Explizit Zero-Click-Aktivierung (kein Edit-Modus). |
| UC-04 Field abschließen | FR-404 | ✅ Ja | **Ergänzen:** Auto-Scroll zum nächsten offenen Field. Keyboard-Shortcut. |
| UC-05 Überblick | FR-100, FR-300 | ✅ Ja | **Ergänzen:** Zuletzt bearbeiteter Prozess hervorgehoben. Deeplink zur letzten Stage. |
| UC-06 Prozess wechseln | FR-100, FR-302 | ⚠️ Teilweise | **Neu:** Quick-Switcher (Cmd+K). Globale Navigation sicherstellen. |
| UC-07 Stage navigieren | FR-300, FR-302 | ⚠️ Teilweise | **Neu:** Persistente Stage-Navigation (immer sichtbar), nicht nur eigene Seite. |
| UC-08 Generate Advanced | FR-501 | ✅ Ja | **Ergänzen:** Auto-Focus auf Zusatzanweisungen. Letzte Anweisungen als Vorschläge. |
| UC-09 Versionshistorie | FR-405 | ✅ Ja | **Neu:** Cmd+Z als Sofort-Undo für letzten KI-Aufruf. Diff-Ansicht. |
| UC-10 Dependency prüfen | FR-600 | ✅ Ja | **Ergänzen:** Hover-Preview (Popover) für Dependencies. |
| UC-11 Neue Idee einspielen | FR-101, FR-200, FR-202 | ✅ Ja | **Ergänzen:** Prozessmodell-Auswahl überspringen in Level 1. Drag-on-Button. |
| UC-12 Task delegieren | FR-701, FR-702 | ✅ Ja | **Ergänzen:** Assignee-Autocomplete. Auto-Typ-Erkennung. |
| UC-13 Task abnehmen | FR-702, FR-703 | ⚠️ Teilweise | **Neu:** Sichtbarkeit von „wartet auf Abnahme"-Tasks im Dashboard/Stage-Übersicht. |
| UC-14 Field wieder öffnen | FR-404 | ✅ Ja | OK -- kein Bestätigungsdialog nötig (Versionshistorie als Safety-Net). |
| UC-15 Prozess archivieren | FR-102 | ✅ Ja | OK |

### Identifizierte Lücken (Zusammenfassung)

| ID | Lücke | Betroffene FRs | Priorität |
|----|-------|----------------|-----------|
| GAP-01 | **Keyboard-Shortcuts** für Kern-Loop fehlen komplett in den FRs | FR-404, FR-500–502 | MUSS |
| GAP-02 | **Auto-Scroll nach Field-Abschluss** nicht spezifiziert | FR-404 | MUSS |
| GAP-03 | **Deeplink zur letzten Stage** beim Prozess-Öffnen nicht spezifiziert | FR-100, FR-300 | MUSS |
| GAP-04 | **Persistente Stage-Navigation** (immer sichtbar) nicht vorgesehen -- aktuell nur als eigene Seite | FR-300 | SOLL |
| GAP-05 | **Quick-Switcher (Cmd+K)** fehlt | Neu | SOLL |
| GAP-06 | **Quick-Action-Chips im Optimize-Modal** fehlen | FR-502 | SOLL |
| GAP-07 | **Cmd+Z als KI-Undo** nicht spezifiziert | FR-405 | SOLL |
| GAP-08 | **Hover-Preview für Dependencies** nicht spezifiziert | FR-600 | SOLL |
| GAP-09 | **Assignee-Autocomplete** bei Tasks fehlt | FR-701 | KANN |
| GAP-10 | **Sichtbarkeit wartender Tasks** im Dashboard nicht spezifiziert | FR-100, FR-702 | SOLL |
| GAP-11 | **Auto-Focus in Modals** nicht explizit spezifiziert | FR-501, FR-502 | MUSS |
| GAP-12 | **Letzte Zusatzanweisungen als Vorschläge** in Generate Advanced fehlt | FR-501 | KANN |
