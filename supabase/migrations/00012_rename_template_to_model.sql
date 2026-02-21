-- =============================================
-- Rename is_template → is_model, status 'template' → 'model'
-- =============================================

BEGIN;

-- 1. Rename column
ALTER TABLE processes RENAME COLUMN is_template TO is_model;

-- 2. Update status values
UPDATE processes SET status = 'model' WHERE status = 'template';

-- 3. Rename index
DROP INDEX IF EXISTS idx_processes_is_template;
CREATE INDEX idx_processes_is_model ON processes(is_model);

-- 4. Recreate RLS policies referencing the renamed column
DROP POLICY IF EXISTS "View templates and own processes" ON processes;
DROP POLICY IF EXISTS "Insert processes" ON processes;
DROP POLICY IF EXISTS "Update templates and own processes" ON processes;
DROP POLICY IF EXISTS "Delete templates and own processes" ON processes;

CREATE POLICY "View models and own processes" ON processes
  FOR SELECT TO authenticated
  USING (is_model = true OR auth.uid() = user_id);

CREATE POLICY "Insert processes" ON processes
  FOR INSERT TO authenticated
  WITH CHECK (is_model = true OR auth.uid() = user_id);

CREATE POLICY "Update models and own processes" ON processes
  FOR UPDATE TO authenticated
  USING (is_model = true OR auth.uid() = user_id);

CREATE POLICY "Delete models and own processes" ON processes
  FOR DELETE TO authenticated
  USING (is_model = true OR auth.uid() = user_id);

-- Child table policies reference is_template via subqueries — recreate them
DROP POLICY IF EXISTS "Manage stages" ON stages;
CREATE POLICY "Manage stages" ON stages
  FOR ALL TO authenticated
  USING (process_id IN (
    SELECT id FROM processes WHERE is_model = true OR user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage steps" ON steps;
CREATE POLICY "Manage steps" ON steps
  FOR ALL TO authenticated
  USING (stage_id IN (
    SELECT s.id FROM stages s
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_model = true OR p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage fields" ON fields;
CREATE POLICY "Manage fields" ON fields
  FOR ALL TO authenticated
  USING (step_id IN (
    SELECT st.id FROM steps st
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_model = true OR p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage field_versions" ON field_versions;
CREATE POLICY "Manage field_versions" ON field_versions
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT f.id FROM fields f
    JOIN steps st ON st.id = f.step_id
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_model = true OR p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Manage tasks" ON tasks;
CREATE POLICY "Manage tasks" ON tasks
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT f.id FROM fields f
    JOIN steps st ON st.id = f.step_id
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_model = true OR p.user_id = auth.uid()
  ));

COMMIT;
