-- =============================================
-- Volve: Unified Data Model
-- =============================================
-- Merges 8 tables (4 template + 4 instance) into 4 unified tables.
-- Templates and projects live in the same tables,
-- distinguished by processes.is_template.
-- =============================================

BEGIN;

-- =============================================
-- 1. EXTEND processes TABLE
-- =============================================

ALTER TABLE processes ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS header_image TEXT;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE processes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE processes ALTER COLUMN model_id DROP NOT NULL;

ALTER TABLE processes DROP CONSTRAINT IF EXISTS processes_model_id_fkey;
ALTER TABLE processes DROP CONSTRAINT IF EXISTS processes_status_check;
ALTER TABLE processes ADD CONSTRAINT processes_status_check
  CHECK (status IN ('template', 'seeding', 'active', 'completed', 'archived'));

-- Drop old RLS policies on processes (will recreate below)
DROP POLICY IF EXISTS "Users can view own processes" ON processes;
DROP POLICY IF EXISTS "Users can create processes" ON processes;
DROP POLICY IF EXISTS "Users can update own processes" ON processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON processes;

-- =============================================
-- 2. CREATE UNIFIED TABLES
-- =============================================

CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL,
  status TEXT CHECK (status IS NULL OR status IN ('locked', 'open', 'in_progress', 'completed')),
  progress REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  status TEXT CHECK (status IS NULL OR status IN ('open', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'long_text', 'file', 'file_list', 'task')),
  description TEXT,
  ai_prompt TEXT,
  order_index INTEGER NOT NULL,
  dependencies UUID[] DEFAULT '{}',
  content TEXT,
  status TEXT CHECK (status IS NULL OR status IN ('empty', 'open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. MIGRATE TEMPLATE DATA
-- =============================================

-- process_models → processes
INSERT INTO processes (id, name, description, header_image, metadata, is_template, status, progress, created_at, updated_at)
SELECT id, name, description, header_image, COALESCE(metadata, '{}'), true, 'template', 0, created_at, created_at
FROM process_models;

-- stage_templates → stages (template stages have no status/progress)
INSERT INTO stages (id, process_id, name, description, icon, order_index, created_at, updated_at)
SELECT id, model_id, name, description, icon, order_index, created_at, created_at
FROM stage_templates;

-- step_templates → steps
INSERT INTO steps (id, stage_id, name, description, order_index, created_at, updated_at)
SELECT id, stage_template_id, name, description, order_index, created_at, created_at
FROM step_templates;

-- field_templates → fields (template fields have no content/status)
INSERT INTO fields (id, step_id, name, type, description, ai_prompt, order_index, dependencies, created_at, updated_at)
SELECT id, step_template_id, name, type, description, ai_prompt, order_index, dependencies, created_at, created_at
FROM field_templates;

-- =============================================
-- 4. MIGRATE INSTANCE DATA
-- =============================================

-- stage_instances → stages
INSERT INTO stages (id, process_id, name, description, icon, order_index, status, progress, created_at, updated_at)
SELECT id, process_id, name, description, icon, order_index, status, progress, created_at, updated_at
FROM stage_instances;

-- step_instances → steps
INSERT INTO steps (id, stage_id, name, description, order_index, status, created_at, updated_at)
SELECT id, stage_instance_id, name, description, order_index, status, created_at, updated_at
FROM step_instances;

-- field_instances → fields
INSERT INTO fields (id, step_id, name, type, description, ai_prompt, order_index, dependencies, content, status, created_at, updated_at)
SELECT id, step_instance_id, name, type, description, ai_prompt, order_index, dependencies, content, status, created_at, updated_at
FROM field_instances;

-- =============================================
-- 5. UPDATE field_versions AND tasks FKs
-- =============================================

-- field_versions: rename column and re-point FK
ALTER TABLE field_versions DROP CONSTRAINT IF EXISTS field_versions_field_instance_id_fkey;
DROP INDEX IF EXISTS idx_field_versions_field_id;
ALTER TABLE field_versions RENAME COLUMN field_instance_id TO field_id;
ALTER TABLE field_versions ADD CONSTRAINT field_versions_field_id_fkey
  FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;

-- tasks: rename column and re-point FK
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_field_instance_id_fkey;
DROP INDEX IF EXISTS idx_tasks_field_id;
ALTER TABLE tasks RENAME COLUMN field_instance_id TO field_id;
ALTER TABLE tasks ADD CONSTRAINT tasks_field_id_fkey
  FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;

-- =============================================
-- 6. SELF-REFERENTIAL model_id ON processes
-- =============================================

ALTER TABLE processes ADD CONSTRAINT processes_model_id_fkey
  FOREIGN KEY (model_id) REFERENCES processes(id) ON DELETE SET NULL;

-- =============================================
-- 7. DROP OLD TABLES (CASCADE drops triggers, policies, indexes, FKs)
-- =============================================

DROP TABLE IF EXISTS field_instances CASCADE;
DROP TABLE IF EXISTS step_instances CASCADE;
DROP TABLE IF EXISTS stage_instances CASCADE;
DROP TABLE IF EXISTS field_templates CASCADE;
DROP TABLE IF EXISTS step_templates CASCADE;
DROP TABLE IF EXISTS stage_templates CASCADE;
DROP TABLE IF EXISTS process_models CASCADE;

-- Drop old delete-protection functions
DROP FUNCTION IF EXISTS prevent_model_delete_with_instances CASCADE;
DROP FUNCTION IF EXISTS prevent_stage_template_delete_with_instances CASCADE;
DROP FUNCTION IF EXISTS prevent_step_template_delete_with_instances CASCADE;
DROP FUNCTION IF EXISTS prevent_field_template_delete_with_instances CASCADE;

-- =============================================
-- 8. RLS POLICIES
-- =============================================

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Processes: templates visible to all, projects only to owner
CREATE POLICY "View templates and own processes" ON processes
  FOR SELECT TO authenticated
  USING (is_template = true OR auth.uid() = user_id);

CREATE POLICY "Insert processes" ON processes
  FOR INSERT TO authenticated
  WITH CHECK (is_template = true OR auth.uid() = user_id);

CREATE POLICY "Update templates and own processes" ON processes
  FOR UPDATE TO authenticated
  USING (is_template = true OR auth.uid() = user_id);

CREATE POLICY "Delete templates and own processes" ON processes
  FOR DELETE TO authenticated
  USING (is_template = true OR auth.uid() = user_id);

-- Stages
CREATE POLICY "Manage stages" ON stages
  FOR ALL TO authenticated
  USING (process_id IN (
    SELECT id FROM processes WHERE is_template = true OR user_id = auth.uid()
  ));

-- Steps
CREATE POLICY "Manage steps" ON steps
  FOR ALL TO authenticated
  USING (stage_id IN (
    SELECT s.id FROM stages s
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_template = true OR p.user_id = auth.uid()
  ));

-- Fields
CREATE POLICY "Manage fields" ON fields
  FOR ALL TO authenticated
  USING (step_id IN (
    SELECT st.id FROM steps st
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_template = true OR p.user_id = auth.uid()
  ));

-- Field versions (updated for renamed column)
DROP POLICY IF EXISTS "Users can manage field versions of own processes" ON field_versions;
CREATE POLICY "Manage field versions" ON field_versions
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT f.id FROM fields f
    JOIN steps st ON st.id = f.step_id
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_template = true OR p.user_id = auth.uid()
  ));

-- Tasks (updated for renamed column)
DROP POLICY IF EXISTS "Users can manage tasks of own processes" ON tasks;
CREATE POLICY "Manage tasks" ON tasks
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT f.id FROM fields f
    JOIN steps st ON st.id = f.step_id
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_template = true OR p.user_id = auth.uid()
  ));

-- =============================================
-- 9. INDEXES
-- =============================================

CREATE INDEX idx_stages_process_id ON stages(process_id);
CREATE INDEX idx_steps_stage_id ON steps(stage_id);
CREATE INDEX idx_fields_step_id ON fields(step_id);
CREATE INDEX idx_field_versions_field_id ON field_versions(field_id);
CREATE INDEX idx_tasks_field_id ON tasks(field_id);
CREATE INDEX idx_processes_is_template ON processes(is_template);

-- =============================================
-- 10. UPDATED_AT TRIGGERS
-- =============================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
