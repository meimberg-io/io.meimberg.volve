# Konzeption einer Applikation zur Ideenrealisierung

## Komplett strukturierte Transkription

### Einführung

Dieses Dokument fasst die Überlegungen und konzeptionellen Entwürfe für eine Softwareanwendung zusammen, die den Prozess der Ideenrealisierung strukturiert und unterstützt. Die Diskussion, geführt von Oli, konzentriert sich auf die Benennung der Strukturelemente, das zugrundeliegende Datenmodell und die Gestaltung der Benutzeroberfläche (UI). Als zentrales, durchgehendes Beispiel dient der Prozess zur Realisierung einer Geschäftsidee, um die Anforderungen an die Anwendung zu verdeutlichen und zu konkretisieren.

### Grundlegende Struktur: Stages und Steps

Zu Beginn wird eine klare Terminologie für die Gliederung der Prozesse festgelegt. Ein übergeordneter Prozess, wie die Realisierung einer Geschäftsidee, wird in mehrere Hauptphasen unterteilt, die als „Stages“ bezeichnet werden. Jede dieser Stages besteht wiederum aus kleineren, konkreten Einzelschritten, den „Steps“. Diese Unterscheidung soll Klarheit in der Struktur und im Ablauf schaffen.

### Gestaltung der Benutzeroberfläche (UI)

Die Benutzeroberfläche muss den Benutzer visuell durch den gesamten Prozess führen. Es ist entscheidend, dass der Anwender jederzeit sehen kann, wie viele Stages ein definierter Prozess umfasst, in welcher Stage er sich aktuell befindet und welche Schritte (Steps) innerhalb dieser Stage noch zu erledigen sind. Dies schafft Orientierung und motiviert, den Fortschritt zu verfolgen.

Eine wichtige, noch offene Frage betrifft die Reihenfolge der Steps innerhalb einer Stage. Es ist unklar, ob diese in einer festen Reihenfolge abgearbeitet werden müssen oder ob eine flexible Bearbeitung möglich sein sollte. Es könnte sogar sinnvoll sein, dass Steps aufeinander aufbauend wiederholt werden können. Als Beispiel wird der Businessplan genannt: Eine Wettbewerbsanalyse könnte nach der Festlegung des Pricings erneut durchgeführt werden, um die Preisstrategie zu verfeinern. Diese Flexibilität muss bei der UI-Gestaltung berücksichtigt werden.

### Das Prozessmodell am Beispiel der Geschäftsideenrealisierung

Um das Konzept zu verdeutlichen, wird das Prozessmodell „Realisierung einer Geschäftsidee“ detailliert beschrieben. Ein solcher Prozess könnte zwischen fünf und fünfzehn Stages umfassen.

- **Stage 1: Der Funke** – In dieser Anfangsphase wird die vage Idee, oft nur als Sprachnotiz, festgehalten.
- **Stage 2: Die Vision** – Hier wird die Idee aus verschiedenen Perspektiven betrachtet, um ein umfassendes Gefühl dafür zu entwickeln, ohne bereits in die konkrete Beschreibung einzusteigen.
- **Weitere Stages:** Spätere Phasen könnten eine erste SWOT-Analyse, die Erstellung eines Businessplans und weitere analytische Schritte umfassen.

Ein wichtiger Aspekt ist, dass jede Stage auf den Ergebnissen der vorherigen aufbaut. Der Businessplan (z.B. Stage 4) nutzt die Informationen aus den Stages 1 bis 3 als Input. Dabei gilt, dass neuere Informationen ältere im Widerspruchsfall überschreiben. Dieser kontextuelle Aufbau muss von der Anwendung unterstützt werden.

Die Komplexität innerhalb einer Stage wird am Beispiel des Businessplans verdeutlicht. Diese Stage könnte zahlreiche Steps wie Marktanalyse, Wettbewerbsanalyse oder die Analyse juristischer Gegebenheiten enthalten. Die UI muss in der Lage sein, auch eine große Anzahl von Steps (z.B. 8 bis 15) übersichtlich darzustellen.

### Datenmodell und Entitäten

Um die beschriebene Struktur abzubilden, wird ein detailliertes Datenmodell entworfen.

1. **Prozessmodell**: Dies ist die oberste Entität mit einem Namen, einer Beschreibung und einem Icon. Es enthält eine geordnete Liste von Stages.
2. **Seed**: Jede Instanz eines Prozesses beginnt mit einem „Seed“. Dies ist eine Sammlung von Ausgangsmaterialien wie Markdown-Dokumenten, Transkripten oder Bildern, die als Grundlage für den gesamten Prozess dienen.
3. **Stage**: Eine Stage hat ebenfalls einen Namen und ein Icon und enthält eine geordnete Liste von Steps. Sie besitzt zudem ein Attribut `completed`, um ihren Status zu verfolgen.
4. **Step**: Früher als „Baustein“ bezeichnet, enthält ein Step eine geordnete Liste von Fields und ebenfalls ein `completed`Attribut.
5. **Field**: Ein Field ist das kleinste Element und kann verschiedene Typen annehmen:
    - **Text**: Ein einfaches Textfeld.
    - **Long-Text**: Ein Markdown-Feld für formatierten Text.
    - **Datei**: Für den Upload einer einzelnen Datei.
    - **Dateiliste**: Für den Upload mehrerer Dateien.
    
    Jedes Field besitzt ebenfalls ein Attribut, um seinen Status (z.B. `closed`) zu kennzeichnen.
    

### Erweiterung des Datenmodells um Tasks und Agents

Das Modell wird weiter ausgebaut, um nicht nur textbasierte, KI-generierte Inhalte, sondern auch konkrete Aufgaben abzubilden. Dafür werden neue Feldtypen eingeführt:

- **Task**: Dieser Feldtyp beschreibt eine Aufgabe, die erledigt werden muss. Er enthält:
    - Eine Taskbeschreibung.
    - Einen `Assignee` (die verantwortliche Person).
    - Einen Status (geplant, delegiert, in Arbeit, erledigt, abgenommen).
    - Ein Markdown-Feld für das `Ergebnis`.
- **Task-Typen**: Ein Task kann weiter spezifiziert werden, je nachdem, wer ihn ausführt:
    - `Self-assigned`: Die Aufgabe wird vom Benutzer selbst erledigt.
    - `Delegated`: Die Aufgabe wird an einen Mitarbeiter oder Dienstleister delegiert.
    - `Agent`: Die Aufgabe wird an einen automatisierten Software-Agenten übergeben.

### Der Kern der Anwendung: KI-gestützte Felder und Abhängigkeiten

Der eigentliche Clou der Anwendung liegt in der KI-Unterstützung. Jedes `Field` kann einen individuellen **Prompt** enthalten. Dieser Prompt ist die Anweisung für die KI, wie der Inhalt des Feldes zu generieren ist.

Ein entscheidendes Merkmal ist, dass Prompts auf andere Felder verweisen können, wodurch **Abhängigkeiten (Dependencies)** entstehen. Ein Beispiel hierfür ist die Wettbewerbsanalyse:

1. **Feld 1: Identifikation der Wettbewerber**: Ein Prompt generiert eine Liste von Konkurrenten.
2. **Feld 2: Analyse der einzelnen Wettbewerber**: Der Prompt für dieses Feld nutzt die Liste aus Feld 1 als Input, um für jeden Wettbewerber eine Detailanalyse zu erstellen.
3. **Feld 3: Bewertung des Wettbewerbsumfelds**: Dieses Feld benötigt die Analyse aus Feld 2 als Input.
4. **Feld 4: Zusammenfassung**: Dieses Feld fasst die Bewertung aus Feld 3 zusammen.

Dieser Abhängigkeitsgraph muss sowohl zwischen Feldern innerhalb eines Steps als auch zwischen Steps innerhalb einer Stage realisiert werden.

### Interaktiver Ablauf und UI-Elemente

Der Prozess für den Benutzer gestaltet sich wie folgt:

1. **Prozess starten**: Der Benutzer wählt ein Prozessmodell (z.B. „Geschäftsidee realisieren“).
2. **Seeding**: In einer „Pre-Stage“ lädt er die Ausgangsdokumente (den Seed) in eine Dropzone hoch.
3. **Stage betreten**: Der Benutzer sieht eine grafisch ansprechende Liste aller Stages und kann die erste freie Stage betreten.
4. **Steps bearbeiten**: Innerhalb der Stage sieht er alle Steps und deren Felder. Felder, die noch offen sind, könnten durch einen blauen Rahmen hervorgehoben werden, während erledigte Felder einen dezenten grünen oder grauen Rahmen erhalten, um ein Gefühl der Zufriedenheit zu vermitteln.

An jedem KI-gestützten Feld stehen dem Benutzer drei Aktionen zur Verfügung:

- **Generate**: Erzeugt den Inhalt des Feldes basierend auf dem vordefinierten Standard-Prompt.
- **Generate Advanced**: Öffnet ein Popup, das den Standard-Prompt anzeigt (der bei Bedarf bearbeitet werden kann) und ein zusätzliches Feld für weitere Anweisungen bietet. Dies erlaubt eine flexible Anpassung der KI-Anweisung, ohne den komplexen Standard-Prompt verändern zu müssen.
- **Optimize**: Öffnet ebenfalls ein Popup, in das der Benutzer einen Verbesserungsprompt eingeben kann (z.B. „fasse das kürzer“). Die KI überarbeitet dann den bestehenden Inhalt des Feldes unter Berücksichtigung aller relevanten Abhängigkeiten.

### Zusammenfassung und Ausblick

Die Konzeption der Ideenrealisierungsapplikation sieht eine hochstrukturierte, aber dennoch flexible Umgebung vor, die den Benutzer durch komplexe Prozesse führt. Durch die Gliederung in Stages und Steps, die visuelle Aufbereitung in der UI und die mächtige KI-Unterstützung durch anpassbare Prompts und Feld-Abhängigkeiten soll ein Werkzeug entstehen, das weit über einfache Notizanwendungen hinausgeht. Das erweiterte Datenmodell, das auch delegierbare Tasks und die Interaktion mit Software-Agenten berücksichtigt, deutet auf eine zukunftsorientierte Plattform hin, die menschliche Kreativität mit maschineller Effizienz verbindet. Die nächsten Schritte umfassen die Finalisierung des Datenmodells und die konkrete Umsetzung der beschriebenen Benutzeroberfläche.

## Adaptive Zusammenfassung


Dieses Dokument skizziert das Brainstorming und die konzeptionelle Ausarbeitung einer KI-gestützten Applikation zur strukturierten Realisierung von Ideen. Es werden die grundlegende Terminologie, das detaillierte Datenmodell, der angedachte Nutzerfluss sowie die zentralen KI-Funktionalitäten und erweiterte Aufgabentypen definiert, um aus einer vagen Idee einen durchgeplanten Prozess zu machen.

### Grundkonzept und Terminologie

Dieser Abschnitt legt die fundamentalen Begrifflichkeiten und die übergeordnete Vision der Anwendung fest. Er definiert die hierarchische Struktur von Prozessen in "Stages" und "Steps" und umreißt die Notwendigkeit einer visuellen Benutzeroberfläche, die den Fortschritt innerhalb eines vordefinierten Prozesses, wie der Realisierung einer Geschäftsidee, klar darstellt.

Die zu entwickelnde Anwendung wird als "Ideenrealisierungsapplikation" bezeichnet und dient der strukturierten Umsetzung von Konzepten. Die grundlegende Struktur ist hierarchisch aufgebaut: Ein übergeordnetes "Prozessmodell" gliedert sich in mehrere "Stages" (Phasen), die wiederum aus einzelnen "Steps" (Schritten) bestehen. Die Benennung "Steps" wird zunächst als Arbeitstitel verwendet.

Ein zentrales UI-Anforderungsmerkmal ist die visuelle Darstellung des gesamten Prozesses. Der Nutzer soll jederzeit klar erkennen können, wie viele Stages ein Prozess umfasst, an welcher Stelle er sich aktuell befindet und welche Aufgaben noch ausstehen. Als primäres Anwendungsbeispiel dient die "Realisierung einer Geschäftsidee", bei der eine Stage beispielsweise "Businessplan erstellen" sein könnte. Solche Prozesse können eine erhebliche Komplexität aufweisen und typischerweise zwischen 5 und 15 Stages umfassen. Es wurde betont, dass Stages voneinander abhängig sind, wobei Informationen aus neueren Stages die aus älteren im Konfliktfall überschreiben. Offen bleibt die Frage, ob die Steps innerhalb einer Stage einer festen Reihenfolge folgen müssen oder flexibel und sogar wiederholt bearbeitet werden können.

### Datenmodell der Prozessarchitektur

Hier wird die detaillierte, hierarchische Datenstruktur der Anwendung definiert. Die Struktur beginnt mit dem übergeordneten "Prozessmodell" und gliedert sich in eine geordnete Liste von "Stages". Jede Stage enthält wiederum geordnete "Steps", die aus einzelnen "Fields" bestehen. Es werden die Attribute und Typen für jede dieser Entitäten spezifiziert, inklusive des initialen "Seed" (Startdatensatz) eines Prozesses sowie des "completed"-Status auf verschiedenen Ebenen.

Die Architektur des Systems basiert auf einem klar definierten Datenmodell:

- **Prozessmodell**: Die oberste Entität. Jedes Prozessmodell besitzt einen `Namen`, eine `Beschreibung`, ein `Icon` und einen initialen `Seed`.
    - **Seed**: Der Startdatensatz für jeden Prozess. Er besteht aus einer Liste von `Markdown-Dokumenten` oder `Bildern`. Es wurde die Idee eines rohen "Raw-Seed" und einer daraus abgeleiteten "konsolidierten" Form diskutiert, welche die erste Stage des Prozesses bilden könnte.
- **Stage**: Ein Prozessmodell enthält eine geordnete Liste von Stages. Jede Stage hat einen `Namen`, ein `Icon` und ein `completed`Attribut, das ihren Abschlussstatus anzeigt.
- **Step**: Jede Stage enthält eine geordnete Liste von Steps. Auch jeder Step besitzt ein `completed`Attribut.
- **Field**: Ein Step besteht aus einer Liste von Fields. Jedes Feld ist das atomare Element zur Dateneingabe und -generierung.
    - **Attribute**: Jedes Field hat einen `individuellen Prompt` für die KI-gestützte Generierung und ein `closed`Attribut (Boolean), um es als finalisiert zu markieren.
    - **Feld-Typen**: Zunächst definierte Typen sind `Text`, `Long-Text` (Markdown), `Datei` und `Dateiliste`.
    - **Abhängigkeiten**: Es wird ein "Dependency Graph" konzipiert, der Abhängigkeiten zwischen Fields innerhalb eines Steps sowie zwischen Steps innerhalb einer Stage abbildet. Dies ermöglicht, dass der Output eines Feldes als Input für ein anderes referenziert werden kann.

### Benutzeroberfläche und Prozessdurchlauf

Dieser Teil beschreibt die konkrete Nutzererfahrung (User Experience) und den chronologischen Ablauf innerhalb der Applikation. Der Prozess beginnt mit dem Starten eines neuen Prozesses und der Auswahl eines Prozessmodells, gefolgt vom Hochladen des "Seed" in eine Dropzone. Anschließend wird der Nutzer visuell durch die aufeinanderfolgenden Stages und deren Steps geführt, wobei der Bearbeitungsstatus der Felder durch visuelle Indikatoren (z. B. farbige Ränder) signalisiert wird.

Der geplante Nutzerfluss gestaltet sich wie folgt:

1. **Prozessstart**: Der Nutzer initiiert einen neuen Prozess und wählt ein vordefiniertes `Prozessmodell` aus (z.B. "Geschäftsidee realisieren").
2. **Seeding**: In einer initialen "Seeding-Stage" lädt der Nutzer die Startdaten (`Seed`) in eine `Dropzone`. Dies können Markdown-Texte, Transkripte oder Bilder sein. Nach dem Speichern ist der Prozess "planted".
3. **Stage-Übersicht**: Dem Nutzer wird eine grafisch ansprechende Übersicht aller Stages des Prozesses angezeigt, was zur Bearbeitung motivieren soll. Ein Prozess kann dabei bis zu 15 Stages umfassen.
4. **Stage-Bearbeitung**: Der Nutzer betritt eine Stage und sieht eine detaillierte Ansicht aller zugehörigen Steps und deren Felder. Die Bearbeitung der Steps ist vorerst nicht an eine feste Reihenfolge gebunden. Die Eingabefelder werden als hochwertige Markdown-Editoren realisiert, die intern rein mit Markdown arbeiten.
5. **Status-Visualisierung**: Der Bearbeitungsstatus wird visuell klar kommuniziert. Im Dark Mode erhalten offene (`open`) Felder einen blauen Rahmen, während abgeschlossene (`closed`) Felder einen dezenten, dunkelgrünen Rahmen bekommen, um ein Gefühl der Erledigung zu vermitteln.
6. **Fortschritt**: Sobald alle Fields eines Steps als `closed` markiert sind, gilt der Step als `completed`. Sind alle Steps einer Stage `completed`, ist die gesamte Stage abgeschlossen, und der Nutzer kann zur nächsten übergehen.

### KI-gestützte Feldinteraktion und Abhängigkeiten

Im Fokus dieses Abschnitts stehen die Kernfunktionalitäten der KI-Interaktion auf Feldebene. Es wird detailliert, wie jedes Feld über einen individuellen Prompt verfügt und mittels Buttons wie "Generate", "Generate Advanced" und "Optimize" mit KI-Unterstützung befüllt oder verfeinert werden kann. Ein zentrales Konzept ist die Definition von Abhängigkeiten (Dependencies) zwischen Feldern und Steps, wodurch der Output eines Elements zum Input für ein anderes wird und so komplexe, logische Abläufe ermöglicht werden.

Jedes `Field` bietet drei Interaktionsmöglichkeiten zur KI-gestützten Inhaltserstellung:

- **Generate**: Erzeugt den Inhalt des Feldes basierend auf dem vordefinierten Standard-Prompt.
- **Optimize**: Öffnet ein Popup-Fenster, in das der Nutzer eine Anweisung zur Verbesserung des bestehenden Inhalts eingeben kann. Die KI erhält dabei den aktuellen Feldinhalt sowie die Inhalte aller abhängigen Felder als Kontext.
- **Generate Advanced**: Zeigt dem Nutzer in einem Modal den Standard-Prompt an, der nur lesbar ist, aber bearbeitet werden kann. Darunter befindet sich ein zusätzliches Eingabefeld für "zusätzliche Anweisungen", um den Prompt für diesen einen Durchlauf zu modifizieren, ohne den Standard-Prompt dauerhaft zu ändern.

Ein entscheidendes Merkmal ist das Management von Abhängigkeiten (`Dependencies`). Der `Prompt` eines Feldes kann die Inhalte anderer Felder als Input referenzieren. So kann beispielsweise die "Analyse der Wettbewerber" (Feld 2) auf der "Liste der Wettbewerber" (Feld 1) aufbauen. Dieser "Dependency Graph" wird sowohl auf der Ebene der Felder innerhalb eines Steps als auch zwischen den Steps innerhalb einer Stage realisiert, um logisch aufeinander aufbauende Arbeitsschritte zu gewährleisten. Die Frage, ob standardmäßig alle "Sibling Steps" (gleichrangige Schritte) als Kontext bereitgestellt werden oder Abhängigkeiten explizit definiert werden müssen, ist noch offen und als To-Do vermerkt.

### Erweiterte Feldtypen und Aufgabenmanagement

Dieser Abschnitt erweitert das grundlegende Datenmodell um fortgeschrittene Feldtypen, die über reine Textgenerierung hinausgehen. Es werden die Konzepte "Task" (manuelle Aufgabe) und "Agent" (automatisierte Aufgabe) eingeführt. Ein "Task"-Feld umfasst Eigenschaften wie eine Beschreibung, einen Zuständigen (Assignee) und einen mehrstufigen Status (z. B. geplant, delegiert, erledigt), was die Integration von menschlichen Arbeitsabläufen und potenziellen autonomen Agenten in den Prozess ermöglicht.

Über die KI-generierten Textfelder hinaus werden weitere Feldtypen konzipiert, um das Aufgabenmanagement direkt in den Prozess zu integrieren:

- **Field-Typ `Task`**: Dient der Abbildung manueller Aufgaben, die von Personen erledigt werden müssen. Ein `Task`Feld beinhaltet folgende Attribute:
    - `Taskbeschreibung`
    - `Assignee` (Zuständiger)
    - `Status` mit den Werten: `planned`, `delegiert`, `in Progress`, `done`, `abgenommen`.
    - Ein Markdown-Feld für das `Ergebnis` der Aufgabe.
- **Task-Typen**: Die Zuweisung eines Tasks wird weiter spezifiziert in:
    - `Self-assigned`: Die Aufgabe wird vom Nutzer selbst erledigt.
    - `Delegated`: Die Aufgabe wird an einen Mitarbeiter oder Dienstleister delegiert.
    - `Agent`: Die Aufgabe wird einem automatisierten Agenten zugewiesen. Dieses Konzept eröffnet die Möglichkeit, zukünftig autonome Systeme in den Prozess einzubinden.

Als Beispiel wurde eine Aufgabe wie "Account anmelden" genannt. Hierbei könnte ein KI-Feld zunächst eine detaillierte `Arbeitsanweisung` generieren. Diese Anweisung wird dann Teil eines `Task`-Feldes, das einem Mitarbeiter zugewiesen wird. Das `Arbeitsergebnis` wird anschließend im selben Task-Feld dokumentiert. Diese Erweiterungen sollen bereits im initialen Datenmodell berücksichtigt werden.

## Strukturierte Fassung

### 1) Terminologie und Struktur

- Prozessmodell: Rahmen für einen wiederholbaren Ablauf (Name, Beschreibung, Icon, Seed, Stages).
- Stage (Phase): Geordnete Hauptabschnitte (z. B. Vision, Research, Businessplan).
- Step (Baustein/Aktion): Geordnete Aufgaben innerhalb einer Stage.
- Field (Feld im Step): Inhaltseinheiten mit Typen und Prompts.

Stages sind die „groben Kapitel“, Steps sind „konkrete Aufgaben“, Fields sind „auszufüllende Teile“ in Aufgaben.

### 2) Datenmodell (v1)

Prozessmodell:

- name, description, icon
- seed: Liste von Markdown-Dokumenten und optional Bildern
- stages: geordnete Liste

Stage:

- name, icon
- steps: geordnete Liste
- completed: boolean

Step:

- name
- fields: geordnete Liste
- completed: boolean
- optional: dependencies auf andere Steps innerhalb derselben Stage

Field:

- types:
    - Text (kurz)
    - Long Text (Markdown)
    - Datei (einzeln)
    - Dateiliste (mehrere)
    - Task (siehe unten)
- prompt: individueller Prompt pro Field, kann andere Fields referenzieren
- dependencies: Liste referenzierter Fields innerhalb desselben Steps
- closed: boolean (read-only bei true)

Task-Field:

- task description (Markdown)
- assignee (Person/Agent)
- type: Self-assigned | Delegated | Agent
- status: planned → delegated → in progress → done → accepted
- result (Markdown)

Hinweis zu Agent-Tasks: identische Struktur wie Task-Field, aber Ausführung durch einen Agent.

Status-Kaskade:

- Wenn alle Fields eines Steps closed sind, wird Step completed = true
- Wenn alle Steps einer Stage completed sind, wird Stage completed = true

### 3) UI-Fluss

Seeding:

- „Neuen Prozess starten“ → Prozessmodell wählen (z. B. „Geschäftsidee realisieren“)
- Pre-Stage: Seed hochladen (Dropzone; Upload/Drag&Drop; Markdown, Bilder, Transkripte)
- Optional: Stage „Seed konsolidieren“ (konkreter Name noch offen), in der der Seed strukturiert zusammengefasst wird

Stage-Übersicht:

- Visuelle Anzeige aller Stages (ca. 5–15 möglich), motivierend gestaltet
- Anzeige, wo ich bin und was fehlt

Stage-Detail:

- Liste der Steps mit ihren Fields
- Bearbeitung parallel möglich; später optional durch Dependencies eingeschränkt
- Editor für Markdown-Felder (Rich-Feeling, intern nur Markdown)
- Field-Status:
    - open: blauer Border
    - closed: dunkelgrüner, sehr dezenter Border (Dark Mode)
- Actions pro Field:
    - Generate: Inhalt per Standard-Prompt erzeugen
    - Generate Advanced: Modal mit
        - Standard-Prompt (read-only, optional editierbar via Stift-Icon)
        - Zusatzanweisungen-Feld (z. B. „Bitte kurz halten“)
    - Optimize: Modal für Verbesserungs-Prompt; nutzt aktuellen Field-Inhalt plus Inhalte der definierten dependency-Fields als Kontext

Dependencies:

- Innerhalb eines Steps: Field 2 kann Field 1 als Input referenzieren (z. B. Wettbewerberliste → detaillierte Analyse → Bewertung → Zusammenfassung)
- Innerhalb einer Stage: Steps können andere Steps voraussetzen (Mandatory vs. Optional)
- Reihenfolge:
    - Kurzfristig: freie Bearbeitung, nur Hinweise
    - Langfristig: Mandatory-Dependencies deaktivieren abhängige Steps/Felder bis Vorläufer completed/closed sind

### 4) Beispiel: Wettbewerbsanalyse in „Businessplan erstellen“

Fields (in einem Step oder aufgeteilt in mehrere Steps):

- Field 1: Liste der Wettbewerber (Markdown, Prompt erzeugt basierend auf Seed/Research)
- Field 2: Detaillierte Analyse pro Wettbewerber (Markdown, Dependency: Field 1)
- Field 3: Ausführliche Bewertung des Wettbewerbsumfelds (Markdown, Dependency: Field 2)
- Field 4: Kurze Zusammenfassung (Markdown, Dependency: Field 3; optional zusätzlich Field 2)

Generate/Optimize:

- Generate nutzt den Prompt des jeweilige Fields plus referenzierte Inputs
- Optimize nimmt bestehenden Field-Inhalt + Dependencies und verbessert nach Zusatzanweisung

### 5) Aufgaben (Tasks) und Agenten

Einsatzfälle:

- „Account anmelden“: Task an Mitarbeiter (Delegated)
    - Field „Arbeitsanweisung“ (per Generate Advanced ergänzen, z. B. spezifischer Name)
    - Field „Ergebnis“: Nachweis/Kommentar
- Agent-Tasks: bestimmte Aktionen an einen Agent übergeben (gleiche Struktur)

Status-Workflow:

- planned → delegated → in progress → done → accepted
- Visualisierung im Field; Abschluss (accepted) schaltet Field auf closed

### 6) Offene Designentscheidungen

- Sibling-Input für Steps/Fields:
    - Option A: Automatisch alle Sibling-Felder als Kontext
    - Option B: Pro Field/Step explizit konfigurierbar (Mandatory/Optional Inputs)
- Naming verbessern:
    - „Step“ eventuell „Baustein“
    - „Seed konsolidiert“: besserer Begriff („Plant“, „Foundation“?)
- Granularität Wettbewerber:
    - Eigene Item-Liste je Wettbewerber vs. ein großes Markdown-Feld
- Kontextfenster-Management:
    - Bei vielen Dependencies: Zusammenfassungen, Chunking, Referenzlinks

### 7) Konkreter nächster Schritt (2026-02-14)

- Datenmodell v1 schriftlich fixieren (Attribute, Typen, Status, Dependencies)
- Zwei Beispiel-Prozessmodelle ausformulieren:
    - „Geschäftsidee realisieren“ (Stages z. B.: Funke, Vision, Research, Businessplan …)
    - „Businessplan erstellen“ (inkl. Wettbewerbsanalyse-Chain)
- Wireframes:
    - Seeding-View (Dropzone, Seed-Liste)
    - Stage-Übersicht (visuelle Timeline/Karten)
    - Step-/Field-Detail (Editor, Buttons Generate/Advanced/Optimize, Status-Indicators, Dependencies-Hinweise)

Wenn du heute anfängst: Schreibe die Mini-Spezifikation und zeichne die Wireframes für Seeding und eine Stage mit 3 Steps und 6 Fields (inkl. einer Dependency-Kette).