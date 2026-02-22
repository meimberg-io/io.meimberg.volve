-- =============================================
-- Field type: dossier + dossier_field_ids column
-- =============================================

-- 1. Allow 'dossier' in fields.type
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_type_check;
ALTER TABLE fields ADD CONSTRAINT fields_type_check
  CHECK (type IN ('text', 'long_text', 'file', 'file_list', 'task', 'task_list', 'dossier'));

-- 2. Add dossier_field_ids array column (referenced field IDs for dossier fields)
ALTER TABLE fields ADD COLUMN IF NOT EXISTS dossier_field_ids UUID[] DEFAULT '{}';
