-- =============================================
-- App Settings table for configurable prompt templates
-- =============================================

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_settings"
  ON app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update app_settings"
  ON app_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert app_settings"
  ON app_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default prompt templates

INSERT INTO app_settings (key, value) VALUES
(
  'tpl_describe_stage',
  'Erzeuge eine prägnante Beschreibung für die Prozess-Stage "{{stage_name}}".

Der übergeordnete Prozess hat folgende Beschreibung:
{{process_description}}

Die Beschreibung soll erklären, was in dieser Stage passiert, welche Ziele verfolgt werden und welche Ergebnisse erwartet werden. Antworte auf Deutsch. Maximal 3-4 Sätze.'
),
(
  'tpl_describe_step',
  'Erzeuge eine prägnante Beschreibung für den Prozess-Step "{{step_name}}" in der Stage "{{stage_name}}".

Der übergeordnete Prozess hat folgende Beschreibung:
{{process_description}}

Die Stage hat folgende Beschreibung:
{{stage_description}}

Die Beschreibung soll erklären, was in diesem Step konkret getan wird. Antworte auf Deutsch. Maximal 2-3 Sätze.'
),
(
  'tpl_generate_stages',
  'Erzeuge alle sinnvollen Stages für einen Prozess mit folgender Beschreibung:
{{process_description}}

Jede Stage soll einen klaren Namen und eine Beschreibung haben. Strukturiere den Prozess in logische, aufeinanderfolgende Phasen. Typischerweise 4-8 Stages.'
),
(
  'tpl_generate_steps',
  'Erzeuge alle sinnvollen Steps mit zugehörigen Fields für folgende Stage:
Stage: "{{stage_name}}"
Stage-Beschreibung: {{stage_description}}

Der übergeordnete Prozess hat folgende Beschreibung:
{{process_description}}

Für jeden Step erzeuge passende Fields. Jedes Field braucht:
- name: Kurzer, beschreibender Name
- type: Einer von "text", "long_text", "file", "file_list", "task"
- description: Was soll in diesem Field erfasst werden
- ai_prompt: Eine detaillierte Anweisung für die KI, die später den Inhalt dieses Fields generieren soll. Der Prompt soll den Kontext des Prozesses, der Stage und des Steps berücksichtigen.

Typischerweise 2-5 Steps pro Stage, mit je 1-4 Fields.'
),
(
  'tpl_generate_dependencies',
  'Analysiere die folgende Liste von Fields eines Prozess-Templates und bestimme sinnvolle Abhängigkeiten.

Ein Field hängt von einem anderen ab, wenn dessen Inhalt als Kontext für die KI-Generierung hilfreich wäre. Typischerweise hängen Fields von früheren Fields aus früheren Stages/Steps ab. Abhängigkeiten sollten nur auf Fields verweisen, die in der Prozessreihenfolge VOR dem jeweiligen Field kommen.

Gib für jedes Field die IDs der Fields an, von denen es abhängt. Fields ohne Abhängigkeiten können übersprungen werden.

{{fields_list}}'
);
