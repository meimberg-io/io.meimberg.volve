-- =============================================
-- Repair migration: 00012 and 00013 failed on production due to
-- CHECK CONSTRAINT processes_status_check not being updated.
-- Both were rolled back but falsely marked as applied in _migrations.
--
-- This migration is fully idempotent: it detects the current column
-- state and applies the necessary renames.
-- =============================================

BEGIN;

-- 1. Remove false _migrations entries (only when using custom migration runner; table does not exist when using Supabase CLI locally)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_migrations'
  ) THEN
    DELETE FROM _migrations WHERE filename IN (
      '00012_rename_template_to_model.sql',
      '00013_rename_model_to_process.sql'
    );
  END IF;
END $$;

-- 2. Idempotent column renames (detect current state)
DO $$
BEGIN
  -- is_template → is_process (skip intermediate is_model)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processes' AND column_name = 'is_template'
  ) THEN
    ALTER TABLE processes RENAME COLUMN is_template TO is_process;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processes' AND column_name = 'is_model'
  ) THEN
    ALTER TABLE processes RENAME COLUMN is_model TO is_process;
  END IF;

  -- template_id / model_id → source_process_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processes' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE processes RENAME COLUMN template_id TO source_process_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processes' AND column_name = 'model_id'
  ) THEN
    ALTER TABLE processes RENAME COLUMN model_id TO source_process_id;
  END IF;
END $$;

-- 3. Drop old check constraint and normalize status before adding new constraint
ALTER TABLE processes DROP CONSTRAINT IF EXISTS processes_status_check;
UPDATE processes SET status = 'process' WHERE status IN ('template', 'model');
ALTER TABLE processes ADD CONSTRAINT processes_status_check
  CHECK (status IN ('process', 'seeding', 'active', 'completed', 'archived'));

-- 5. Fix indexes
DROP INDEX IF EXISTS idx_processes_is_template;
DROP INDEX IF EXISTS idx_processes_is_model;
DROP INDEX IF EXISTS idx_processes_is_process;
CREATE INDEX idx_processes_is_process ON processes(is_process);

-- 6. Recreate RLS policies (drop all possible old names)
DROP POLICY IF EXISTS "View templates and own processes" ON processes;
DROP POLICY IF EXISTS "View models and own processes" ON processes;
DROP POLICY IF EXISTS "View process definitions and own projects" ON processes;
DROP POLICY IF EXISTS "Insert processes" ON processes;
DROP POLICY IF EXISTS "Update templates and own processes" ON processes;
DROP POLICY IF EXISTS "Update models and own processes" ON processes;
DROP POLICY IF EXISTS "Update process definitions and own projects" ON processes;
DROP POLICY IF EXISTS "Delete templates and own processes" ON processes;
DROP POLICY IF EXISTS "Delete models and own processes" ON processes;
DROP POLICY IF EXISTS "Delete process definitions and own projects" ON processes;

CREATE POLICY "View process definitions and own projects" ON processes
  FOR SELECT TO authenticated
  USING (is_process = true OR auth.uid() = user_id);

CREATE POLICY "Insert processes" ON processes
  FOR INSERT TO authenticated
  WITH CHECK (is_process = true OR auth.uid() = user_id);

CREATE POLICY "Update process definitions and own projects" ON processes
  FOR UPDATE TO authenticated
  USING (is_process = true OR auth.uid() = user_id);

CREATE POLICY "Delete process definitions and own projects" ON processes
  FOR DELETE TO authenticated
  USING (is_process = true OR auth.uid() = user_id);

-- Child tables
DROP POLICY IF EXISTS "Manage stages" ON stages;
CREATE POLICY "Manage stages" ON stages
  FOR ALL TO authenticated
  USING (process_id IN (
    SELECT id FROM processes WHERE is_process = true OR user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage steps" ON steps;
CREATE POLICY "Manage steps" ON steps
  FOR ALL TO authenticated
  USING (stage_id IN (
    SELECT s.id FROM stages s
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_process = true OR p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage fields" ON fields;
CREATE POLICY "Manage fields" ON fields
  FOR ALL TO authenticated
  USING (step_id IN (
    SELECT st.id FROM steps st
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_process = true OR p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage field_versions" ON field_versions;
CREATE POLICY "Manage field_versions" ON field_versions
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT f.id FROM fields f
    JOIN steps st ON st.id = f.step_id
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_process = true OR p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage tasks" ON tasks;
CREATE POLICY "Manage tasks" ON tasks
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT f.id FROM fields f
    JOIN steps st ON st.id = f.step_id
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_process = true OR p.user_id = auth.uid()
  ));

-- 7. Re-insert _migrations entries for 00012/00013 (only when custom migration runner is used)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_migrations'
  ) THEN
    INSERT INTO _migrations (filename) VALUES ('00012_rename_template_to_model.sql') ON CONFLICT DO NOTHING;
    INSERT INTO _migrations (filename) VALUES ('00013_rename_model_to_process.sql') ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
