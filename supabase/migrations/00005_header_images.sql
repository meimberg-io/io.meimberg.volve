-- Add header_image column to process_models
ALTER TABLE process_models ADD COLUMN IF NOT EXISTS header_image TEXT;

-- Create storage bucket for header images (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('header-images', 'header-images', true)
ON CONFLICT DO NOTHING;

-- Storage policies (drop first to make migration idempotent)
DROP POLICY IF EXISTS "Anyone can view header images" ON storage.objects;
CREATE POLICY "Anyone can view header images" ON storage.objects
  FOR SELECT USING (bucket_id = 'header-images');

DROP POLICY IF EXISTS "Authenticated users can upload header images" ON storage.objects;
CREATE POLICY "Authenticated users can upload header images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'header-images');

DROP POLICY IF EXISTS "Authenticated users can update header images" ON storage.objects;
CREATE POLICY "Authenticated users can update header images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'header-images');

DROP POLICY IF EXISTS "Authenticated users can delete header images" ON storage.objects;
CREATE POLICY "Authenticated users can delete header images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'header-images');

-- Additional AI prompt templates
INSERT INTO app_settings (key, value) VALUES
(
  'tpl_header_image',
  'Erstelle ein abstraktes, modernes Header-Bild für folgenden Geschäftsprozess: {{model_name}}

Stil: minimalistisch, professionell, dunkler Hintergrund mit blauen und türkisen Akzenten. Kein Text im Bild. Hochwertig und corporate.

Konkrete Bildbeschreibung: {{user_prompt}}'
),
(
  'tpl_extend_stages',
  'Erzeuge ZUSÄTZLICHE Stages für einen Prozess mit folgender Beschreibung:
{{process_description}}

Diese Stages existieren bereits:
{{existing_items}}

## ANWEISUNG DES NUTZERS
{{user_prompt}}

WICHTIG:
- Folge der Anweisung des Nutzers so genau wie möglich.
- Generiere NUR neue Stages, die der Anweisung entsprechen.
- Wiederhole KEINE der bestehenden Stages.

Jede Stage soll einen klaren Namen und eine Beschreibung haben.'
),
(
  'tpl_extend_steps',
  'Erzeuge ZUSÄTZLICHE Steps mit zugehörigen Fields für folgende Stage:
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
- ai_prompt: Eine detaillierte Anweisung für die KI, die später den Inhalt dieses Fields generieren soll.'
)
ON CONFLICT (key) DO NOTHING;
