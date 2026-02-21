# **Volve: Wie wir ein KI-gestütztes Workflow-System für Geschäftsideen bauen**

## **Die Idee hinter Volve**

Wer kennt es nicht: Man hat ständig neue Geschäftsideen, notiert sie schnell in einem Notizbuch oder als Sprachmemo – und dort bleiben sie. Unstrukturiert, unbearbeitet, vergessen. Dabei steckt in vielen dieser Ideen echtes Potenzial. Was fehlt, ist nicht die Kreativität, sondern ein systematischer Prozess, der aus einem vagen Gedanken ein konkretes, umsetzbares Konzept formt.

Genau hier setzt **Volve** an: ein KI-gestützter Multi-Inkubator für Geschäftsideen. Jede Idee ist ein *Seed* – ein Samen, der durch strukturierte Entwicklungsstufen wächst: vom ersten Funken über Vision, Research und SWOT-Analyse bis zum fertigen Businessplan und Maßnahmenplan.

## **Der Beweis: Ein Blog-Workflow als Vorbild**

Die Inspiration kam aus einem kleineren Projekt. Früher war das Schreiben eines Blogbeitrags ein aufwändiger Prozess – Idee, Gliederung, Text, Abstract, Bild, Publishing. Das Ergebnis: Es wurde fast nie gebloggt. Dann haben wir einen KI-gestützten Workflow gebaut. Heute: Sprachnotiz aufnehmen, zwei Klicks, und in zehn Minuten steht ein veröffentlichungsbereiter Beitrag. Die Blockade war verschwunden.

Wenn das bei einem einzelnen Blogbeitrag so gut funktioniert – warum nicht auch bei etwas Komplexerem? Das war die Wette. Und Volve ist der Versuch, sie zu gewinnen.

## **Die Architektur: Stages, Steps, Fields**

Volve basiert auf einem klaren Meta-Modell:

- **Prozessmodell**: Der Rahmen – das "Rezept" für einen wiederholbaren Ablauf.
- **Stages**: Die großen Entwicklungsstufen. Bei einer Geschäftsidee typischerweise 5–15 Stück – vom "Funken" bis zum "Rollout".
- **Steps**: Konkrete Aufgaben innerhalb einer Stage. Zum Beispiel "Wettbewerbsanalyse" oder "Vision formulieren".
- **Fields**: Die atomaren Einheiten – Textfelder, Markdown-Editoren, Datei-Uploads, Task-Zuweisungen. Jedes Field kann einen eigenen KI-Prompt haben.

Das Besondere: Fields können Abhängigkeiten (*Dependencies*) untereinander definieren. Das Ergebnis der Wettbewerberliste fließt automatisch als Kontext in die Wettbewerbsanalyse. So entsteht eine intelligente Chain, bei der jeder Schritt auf den vorherigen aufbaut.

## **KI an jeder Stelle – aber der Mensch steuert**

Volve ist kein autonomer Agent, der einfach "macht". Es ist das Gegenteil: ein strukturiertes System, in dem der Mensch an jeder Stelle die Kontrolle hat und die KI als Beschleuniger nutzt.

Pro Field stehen drei KI-Aktionen zur Verfügung:

- **Generate**: Ein Klick, und die KI erzeugt den Inhalt basierend auf dem konfigurierten Prompt und allen referenzierten Feldern.
- **Generate Advanced**: Der Standard-Prompt kann einmalig angepasst werden – zum Beispiel "Fokus auf den DACH-Markt".
- **Optimize**: Ein bereits generierter Text wird überarbeitet – "Kürzer", "Mit konkreten Zahlen", "Formeller".

Der Kern-Loop – Field öffnen, Generate klicken, Ergebnis lesen, gegebenenfalls Optimize, abschließen, weiter – ist auf maximale Effizienz getrimmt. 1–2 Klicks pro Aktion, unter 5 Sekunden bis zum ersten Streaming-Output.

## **Template-Editor: Die Prozesse selbst gestalten**

Volve liefert ein Default-Prozessmodell für Geschäftsideen mit. Aber das Meta-Modell ist flexibel: Im integrierten Template-Editor lassen sich Stages, Steps und Fields frei anlegen, bearbeiten und per Drag & Drop umsortieren. KI-Prompts, Feldtypen, Beschreibungen, Abhängigkeiten – alles konfigurierbar.

Wir nutzen dabei selbst KI: Per Knopfdruck können Stages und Steps für ein Prozessmodell generiert werden. Die Prozessbeschreibung liefert den Kontext, der Rest passiert automatisch. Sogar die Headerbilder der Prozessmodelle werden per DALL-E generiert – mit einem konfigurierbaren Prompt, der durch den Prozesskontext angereichert wird.

Bei jedem Start eines neuen Prozesses wird ein **Snapshot** des Templates erstellt. Spätere Template-Änderungen wirken nur auf neue Prozesse – bestehende bleiben stabil.

## **Der Tech-Stack**

Volve ist als moderne Webapplikation gebaut:

- **Frontend**: Next.js (App Router), React, Tailwind CSS, shadcn/ui
- **Rich-Text-Editing**: Tiptap mit Markdown-Support und BubbleMenu
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **KI-Integration**: OpenAI GPT-4o-mini für Textgenerierung (via AI SDK mit Streaming), DALL-E 3 für Bildgenerierung
- **Deployment**: Docker / Standalone Build

## **Die Vision: Vom Tool zum generischen Workflow-System**

Volve Level 1 – das Business-Development-Tool – ist der Proof of Concept. Die eigentliche Vision ist Level 2: ein generisches, konfigurierbares Workflow-System. Dasselbe Meta-Modell aus Stages, Steps und Fields, aber für beliebige Prozesse. Blogbeiträge, Softwareentwicklung, Onboarding-Prozesse, Forschungsprojekte – alles, was sich in Phasen und Schritte gliedern lässt, kann mit KI-Unterstützung systematisch abgearbeitet werden.

Die zentrale Frage, die Volve beantworten soll: **Lassen sich komplexe Entwicklungsprozesse in ein konfigurierbares Meta-Modell pressen – und funktioniert die KI-Unterstützung dabei so gut wie beim einfachen Blog-Workflow?**