-- =============================================
-- Volve: Shared Snippets
-- =============================================

CREATE TABLE snippet_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES snippet_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES snippet_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_description TEXT,
  content TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snippet_folders_parent_id ON snippet_folders(parent_id);
CREATE INDEX idx_snippet_folders_order_index ON snippet_folders(order_index);
CREATE INDEX idx_snippet_folders_updated_at ON snippet_folders(updated_at DESC);
CREATE INDEX idx_snippets_folder_id ON snippets(folder_id);
CREATE INDEX idx_snippets_order_index ON snippets(order_index);
CREATE INDEX idx_snippets_updated_at ON snippets(updated_at DESC);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON snippet_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON snippets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE snippet_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view snippet folders"
  ON snippet_folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create snippet folders"
  ON snippet_folders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update snippet folders"
  ON snippet_folders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete snippet folders"
  ON snippet_folders FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view snippets"
  ON snippets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create snippets"
  ON snippets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update snippets"
  ON snippets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete snippets"
  ON snippets FOR DELETE TO authenticated USING (true);
