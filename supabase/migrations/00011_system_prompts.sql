-- =============================================
-- System-Prompts: Global settings + cascade columns
-- =============================================

BEGIN;

-- 1. Global system prompt settings
INSERT INTO app_settings (key, value) VALUES
  ('ai_meta_prompt', 'Antworte ausschließlich mit dem angeforderten Inhalt. Stelle keine Rückfragen, biete keine Ergänzungen an und schreibe keine Meta-Kommentare wie "Soll ich noch..." oder "Wenn du möchtest...". Liefere das fertige Ergebnis direkt und vollständig.'),
  ('ai_system_modelling', 'Du bist ein erfahrener Business-Berater und Prozess-Designer. Du hilfst bei der systematischen Strukturierung von Geschäftsprozessen. Antworte auf Deutsch.'),
  ('ai_system_execution', 'Du bist ein erfahrener Business-Berater und Strategie-Assistent. Du hilfst bei der systematischen Entwicklung von Geschäftsideen. Antworte auf Deutsch. Nutze Markdown-Formatierung (Überschriften, Tabellen, Listen, etc.).')
ON CONFLICT (key) DO NOTHING;

-- 2. Cascade columns for execution prompt overrides
ALTER TABLE processes ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT;
ALTER TABLE stages ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT;

COMMIT;
