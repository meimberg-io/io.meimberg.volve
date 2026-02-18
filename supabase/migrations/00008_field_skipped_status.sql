-- Add 'skipped' status option for fields marked as "Nicht relevant"
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_status_check;
ALTER TABLE fields ADD CONSTRAINT fields_status_check
  CHECK (status IS NULL OR status IN ('empty', 'open', 'closed', 'skipped'));
