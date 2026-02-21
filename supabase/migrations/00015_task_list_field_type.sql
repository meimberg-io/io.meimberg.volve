-- =============================================
-- Field type: task_list + task_list_items table
-- =============================================

-- 1. Allow 'task_list' in fields.type
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_type_check;
ALTER TABLE fields ADD CONSTRAINT fields_type_check
  CHECK (type IN ('text', 'long_text', 'file', 'file_list', 'task', 'task_list'));

-- 2. task_list_items table
CREATE TABLE task_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'self' CHECK (type IN ('self', 'delegated')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'planned', 'in_progress', 'done', 'wont_do')),
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_list_items_field_id ON task_list_items(field_id);

CREATE TRIGGER set_updated_at_task_list_items
  BEFORE UPDATE ON task_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE task_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage task_list_items" ON task_list_items
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT f.id FROM fields f
    JOIN steps st ON st.id = f.step_id
    JOIN stages s ON s.id = st.stage_id
    JOIN processes p ON p.id = s.process_id
    WHERE p.is_process = true OR p.user_id = auth.uid()
  ));

-- 3. Include task_list in structure-generation prompt templates
UPDATE app_settings SET value = REPLACE(value, '"file_list", "task"', '"file_list", "task", "task_list"')
  WHERE key = 'tpl_generate_steps';
UPDATE app_settings SET value = REPLACE(value, '"file_list", "task"', '"file_list", "task", "task_list"')
  WHERE key = 'tpl_extend_steps';
