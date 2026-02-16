-- =============================================
-- Volve: Template Snapshots + Template CRUD
-- =============================================
-- Adds snapshot columns to instance tables so that
-- instances are self-contained after creation.
-- Also adds RLS policies for template CRUD and
-- delete-protection triggers.
-- =============================================

-- =============================================
-- 1. SNAPSHOT COLUMNS ON INSTANCE TABLES
-- =============================================

-- stage_instances: copy name, description, icon, order_index from template
ALTER TABLE stage_instances
  ADD COLUMN name TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN icon TEXT,
  ADD COLUMN order_index INTEGER;

-- step_instances: copy name, description, order_index from template
ALTER TABLE step_instances
  ADD COLUMN name TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN order_index INTEGER;

-- field_instances: copy name, type, description, ai_prompt, order_index, dependencies from template
ALTER TABLE field_instances
  ADD COLUMN name TEXT,
  ADD COLUMN type TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN ai_prompt TEXT,
  ADD COLUMN order_index INTEGER,
  ADD COLUMN dependencies UUID[] DEFAULT '{}';

-- =============================================
-- 2. BACKFILL EXISTING INSTANCES FROM TEMPLATES
-- =============================================

UPDATE stage_instances si SET
  name = st.name,
  description = st.description,
  icon = st.icon,
  order_index = st.order_index
FROM stage_templates st
WHERE si.stage_template_id = st.id;

UPDATE step_instances sti SET
  name = stt.name,
  description = stt.description,
  order_index = stt.order_index
FROM step_templates stt
WHERE sti.step_template_id = stt.id;

UPDATE field_instances fi SET
  name = ft.name,
  type = ft.type,
  description = ft.description,
  ai_prompt = ft.ai_prompt,
  order_index = ft.order_index,
  dependencies = ft.dependencies
FROM field_templates ft
WHERE fi.field_template_id = ft.id;

-- =============================================
-- 3. RLS POLICIES FOR TEMPLATE CRUD
-- =============================================

-- process_models: INSERT, UPDATE, DELETE for authenticated
CREATE POLICY "Authenticated users can insert process_models"
  ON process_models FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update process_models"
  ON process_models FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete process_models"
  ON process_models FOR DELETE TO authenticated USING (true);

-- stage_templates: INSERT, UPDATE, DELETE for authenticated
CREATE POLICY "Authenticated users can insert stage_templates"
  ON stage_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stage_templates"
  ON stage_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stage_templates"
  ON stage_templates FOR DELETE TO authenticated USING (true);

-- step_templates: INSERT, UPDATE, DELETE for authenticated
CREATE POLICY "Authenticated users can insert step_templates"
  ON step_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update step_templates"
  ON step_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete step_templates"
  ON step_templates FOR DELETE TO authenticated USING (true);

-- field_templates: INSERT, UPDATE, DELETE for authenticated
CREATE POLICY "Authenticated users can insert field_templates"
  ON field_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update field_templates"
  ON field_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete field_templates"
  ON field_templates FOR DELETE TO authenticated USING (true);

-- =============================================
-- 4. DELETE-PROTECTION TRIGGERS
-- =============================================

-- Prevent deleting a process_model if processes reference it
CREATE OR REPLACE FUNCTION prevent_model_delete_with_instances()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM processes WHERE model_id = OLD.id) THEN
    RAISE EXCEPTION 'Dieses Prozessmodell wird von bestehenden Prozessen verwendet und kann nicht gelöscht werden.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_process_model_delete
  BEFORE DELETE ON process_models
  FOR EACH ROW EXECUTE FUNCTION prevent_model_delete_with_instances();

-- Prevent deleting a stage_template if stage_instances reference it
CREATE OR REPLACE FUNCTION prevent_stage_template_delete_with_instances()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM stage_instances WHERE stage_template_id = OLD.id) THEN
    RAISE EXCEPTION 'Dieses Stage-Template wird von bestehenden Prozessen verwendet und kann nicht gelöscht werden.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_stage_template_delete
  BEFORE DELETE ON stage_templates
  FOR EACH ROW EXECUTE FUNCTION prevent_stage_template_delete_with_instances();

-- Prevent deleting a step_template if step_instances reference it
CREATE OR REPLACE FUNCTION prevent_step_template_delete_with_instances()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM step_instances WHERE step_template_id = OLD.id) THEN
    RAISE EXCEPTION 'Dieses Step-Template wird von bestehenden Prozessen verwendet und kann nicht gelöscht werden.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_step_template_delete
  BEFORE DELETE ON step_templates
  FOR EACH ROW EXECUTE FUNCTION prevent_step_template_delete_with_instances();

-- Prevent deleting a field_template if field_instances reference it
CREATE OR REPLACE FUNCTION prevent_field_template_delete_with_instances()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM field_instances WHERE field_template_id = OLD.id) THEN
    RAISE EXCEPTION 'Dieses Field-Template wird von bestehenden Prozessen verwendet und kann nicht gelöscht werden.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_field_template_delete
  BEFORE DELETE ON field_templates
  FOR EACH ROW EXECUTE FUNCTION prevent_field_template_delete_with_instances();

-- =============================================
-- 5. DROP UNIQUE CONSTRAINTS ON order_index
-- =============================================
-- The unique constraints on (parent_id, order_index) prevent
-- easy reordering. We drop them and rely on application logic
-- to maintain order consistency.

ALTER TABLE stage_templates DROP CONSTRAINT IF EXISTS stage_templates_model_id_order_index_key;
ALTER TABLE step_templates DROP CONSTRAINT IF EXISTS step_templates_stage_template_id_order_index_key;
ALTER TABLE field_templates DROP CONSTRAINT IF EXISTS field_templates_step_template_id_order_index_key;
