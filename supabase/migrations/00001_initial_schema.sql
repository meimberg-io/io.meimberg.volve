-- =============================================
-- Volve: Initial Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TEMPLATE LAYER (read-only process model definitions)
-- =============================================

CREATE TABLE process_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stage_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES process_models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (model_id, order_index)
);

CREATE TABLE step_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_template_id UUID NOT NULL REFERENCES stage_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stage_template_id, order_index)
);

CREATE TABLE field_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_template_id UUID NOT NULL REFERENCES step_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'long_text', 'file', 'file_list', 'task')),
  description TEXT,
  ai_prompt TEXT,
  order_index INTEGER NOT NULL,
  dependencies UUID[] DEFAULT '{}',  -- Array of other field_template IDs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (step_template_id, order_index)
);

-- =============================================
-- 2. USER PROFILES
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 3. INSTANCE LAYER (user data)
-- =============================================

CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_id UUID NOT NULL REFERENCES process_models(id),
  status TEXT NOT NULL DEFAULT 'seeding' CHECK (status IN ('seeding', 'active', 'completed', 'archived')),
  progress REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seed_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stage_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  stage_template_id UUID NOT NULL REFERENCES stage_templates(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('locked', 'open', 'in_progress', 'completed')),
  progress REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE step_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_instance_id UUID NOT NULL REFERENCES stage_instances(id) ON DELETE CASCADE,
  step_template_id UUID NOT NULL REFERENCES step_templates(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE field_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_instance_id UUID NOT NULL REFERENCES step_instances(id) ON DELETE CASCADE,
  field_template_id UUID NOT NULL REFERENCES field_templates(id),
  content TEXT,
  status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE field_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_instance_id UUID NOT NULL REFERENCES field_instances(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'generate', 'generate_advanced', 'optimize')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 4. TASK MANAGEMENT
-- =============================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_instance_id UUID NOT NULL REFERENCES field_instances(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  assignee TEXT,
  type TEXT NOT NULL DEFAULT 'self' CHECK (type IN ('self', 'delegated', 'agent')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'delegated', 'in_progress', 'done', 'accepted')),
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 5. INDEXES
-- =============================================

CREATE INDEX idx_processes_user_id ON processes(user_id);
CREATE INDEX idx_processes_status ON processes(status);
CREATE INDEX idx_processes_updated_at ON processes(updated_at DESC);
CREATE INDEX idx_stage_instances_process_id ON stage_instances(process_id);
CREATE INDEX idx_step_instances_stage_id ON step_instances(stage_instance_id);
CREATE INDEX idx_field_instances_step_id ON field_instances(step_instance_id);
CREATE INDEX idx_field_versions_field_id ON field_versions(field_instance_id);
CREATE INDEX idx_seed_documents_process_id ON seed_documents(process_id);
CREATE INDEX idx_tasks_field_id ON tasks(field_instance_id);

-- =============================================
-- 6. UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON stage_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON step_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON field_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 7. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_templates ENABLE ROW LEVEL SECURITY;

-- Template tables: read-only for all authenticated
CREATE POLICY "Templates are readable by all authenticated users" ON process_models
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Templates are readable by all authenticated users" ON stage_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Templates are readable by all authenticated users" ON step_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Templates are readable by all authenticated users" ON field_templates
  FOR SELECT TO authenticated USING (true);

-- Profiles: users can read/update own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Processes: owner only
CREATE POLICY "Users can view own processes" ON processes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create processes" ON processes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own processes" ON processes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own processes" ON processes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed documents: via process ownership
CREATE POLICY "Users can manage seed documents of own processes" ON seed_documents
  FOR ALL TO authenticated
  USING (process_id IN (SELECT id FROM processes WHERE user_id = auth.uid()));

-- Stage instances: via process ownership
CREATE POLICY "Users can manage stage instances of own processes" ON stage_instances
  FOR ALL TO authenticated
  USING (process_id IN (SELECT id FROM processes WHERE user_id = auth.uid()));

-- Step instances: via stage -> process ownership
CREATE POLICY "Users can manage step instances of own processes" ON step_instances
  FOR ALL TO authenticated
  USING (stage_instance_id IN (
    SELECT si.id FROM stage_instances si
    JOIN processes p ON p.id = si.process_id
    WHERE p.user_id = auth.uid()
  ));

-- Field instances: via step -> stage -> process ownership
CREATE POLICY "Users can manage field instances of own processes" ON field_instances
  FOR ALL TO authenticated
  USING (step_instance_id IN (
    SELECT sti.id FROM step_instances sti
    JOIN stage_instances si ON si.id = sti.stage_instance_id
    JOIN processes p ON p.id = si.process_id
    WHERE p.user_id = auth.uid()
  ));

-- Field versions: via field -> step -> stage -> process ownership
CREATE POLICY "Users can manage field versions of own processes" ON field_versions
  FOR ALL TO authenticated
  USING (field_instance_id IN (
    SELECT fi.id FROM field_instances fi
    JOIN step_instances sti ON sti.id = fi.step_instance_id
    JOIN stage_instances si ON si.id = sti.stage_instance_id
    JOIN processes p ON p.id = si.process_id
    WHERE p.user_id = auth.uid()
  ));

-- Tasks: via field -> step -> stage -> process ownership
CREATE POLICY "Users can manage tasks of own processes" ON tasks
  FOR ALL TO authenticated
  USING (field_instance_id IN (
    SELECT fi.id FROM field_instances fi
    JOIN step_instances sti ON sti.id = fi.step_instance_id
    JOIN stage_instances si ON si.id = sti.stage_instance_id
    JOIN processes p ON p.id = si.process_id
    WHERE p.user_id = auth.uid()
  ));

-- =============================================
-- 8. STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('seeds', 'seeds', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload seed files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'seeds' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own seed files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'seeds' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own seed files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'seeds' AND (storage.foldername(name))[1] = auth.uid()::text);
