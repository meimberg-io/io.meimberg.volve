-- Update prompt templates to instruct AI not to embed structural references
-- (stage names, step names, section numbers) in ai_prompt values,
-- since structural context is now injected dynamically at runtime.

UPDATE app_settings SET value = 'Erzeuge alle sinnvollen Steps mit zugehörigen Fields für folgende Stage:
Stage: "{{stage_name}}"
Stage-Beschreibung: {{stage_description}}

Der übergeordnete Prozess hat folgende Beschreibung:
{{process_description}}

Für jeden Step erzeuge passende Fields. Jedes Field braucht:
- name: Kurzer, beschreibender Name
- type: Einer von "text", "long_text", "file", "file_list", "task"
- description: Was soll in diesem Field erfasst werden
- ai_prompt: Eine detaillierte, inhaltlich fokussierte Anweisung für die KI, die später den Inhalt dieses Fields generieren soll. Beschreibe WAS generiert werden soll und welche Qualitätskriterien gelten. Nenne NICHT die Namen von Stages, Steps, Abschnitten oder deren Nummerierungen — der strukturelle Kontext wird zur Laufzeit automatisch hinzugefügt.

Typischerweise 2-5 Steps pro Stage, mit je 1-4 Fields.'
WHERE key = 'tpl_generate_steps';

UPDATE app_settings SET value = 'Erzeuge ZUSÄTZLICHE Steps mit zugehörigen Fields für folgende Stage:
Stage: "{{stage_name}}"
Stage-Beschreibung: {{stage_description}}

Der übergeordnete Prozess hat folgende Beschreibung:
{{process_description}}

Diese Steps existieren bereits in der Stage:
{{existing_items}}

## ANWEISUNG DES NUTZERS
{{user_prompt}}

WICHTIG:
- Folge der Anweisung des Nutzers so genau wie möglich.
- Generiere NUR neue Steps, die der Anweisung entsprechen.
- Wiederhole KEINE der bestehenden Steps.

Für jeden neuen Step erzeuge passende Fields. Jedes Field braucht:
- name: Kurzer, beschreibender Name
- type: Einer von "text", "long_text", "file", "file_list", "task"
- description: Was soll in diesem Field erfasst werden
- ai_prompt: Eine detaillierte, inhaltlich fokussierte Anweisung für die KI, die später den Inhalt dieses Fields generieren soll. Beschreibe WAS generiert werden soll und welche Qualitätskriterien gelten. Nenne NICHT die Namen von Stages, Steps, Abschnitten oder deren Nummerierungen — der strukturelle Kontext wird zur Laufzeit automatisch hinzugefügt.'
WHERE key = 'tpl_extend_steps';
