// =============================================
// Volve Domain Types (Unified Model)
// =============================================

// --- Enums ---

export type ProcessStatus = "template" | "seeding" | "active" | "completed" | "archived";

export type StageStatus = "locked" | "open" | "in_progress" | "completed";

export type StepStatus = "open" | "in_progress" | "completed";

export type FieldStatus = "empty" | "open" | "closed" | "skipped";

export type FieldType = "text" | "long_text" | "file" | "file_list" | "task";

export type TaskStatus =
  | "planned"
  | "delegated"
  | "in_progress"
  | "done"
  | "accepted";

export type TaskType = "self" | "delegated" | "agent";

export type AIActionSource = "generate" | "generate_advanced" | "optimize" | "manual";

// --- Unified Data Layer ---

export interface Process {
  id: string;
  user_id: string | null;
  name: string;
  model_id: string | null;
  is_template: boolean;
  description: string | null;
  header_image: string | null;
  metadata: Record<string, unknown> | null;
  ai_system_prompt: string | null;
  status: ProcessStatus;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  id: string;
  process_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  ai_system_prompt: string | null;
  order_index: number;
  status: StageStatus | null;
  progress: number | null;
  created_at: string;
  updated_at: string;
}

export interface Step {
  id: string;
  stage_id: string;
  name: string;
  description: string | null;
  order_index: number;
  status: StepStatus | null;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  step_id: string;
  name: string;
  type: FieldType;
  description: string | null;
  ai_prompt: string | null;
  order_index: number;
  dependencies: string[] | null;
  content: string | null;
  status: FieldStatus | null;
  created_at: string;
  updated_at: string;
}

export interface SeedDocument {
  id: string;
  process_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  order_index: number;
  created_at: string;
}

export interface FieldVersion {
  id: string;
  field_id: string;
  content: string;
  source: AIActionSource;
  created_at: string;
}

export interface Task {
  id: string;
  field_id: string;
  description: string;
  assignee: string | null;
  type: TaskType;
  status: TaskStatus;
  result: string | null;
  created_at: string;
  updated_at: string;
}

export interface SnippetFolder {
  id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Snippet {
  id: string;
  folder_id: string | null;
  name: string;
  short_description: string | null;
  content: string;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// --- User Profile ---

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// --- Composite Types ---

export interface StepWithFields extends Step {
  fields: Field[];
}

export interface StageWithSteps extends Stage {
  steps: StepWithFields[];
}

export interface ProcessWithStages extends Process {
  stages: Stage[];
}

export interface SnippetFolderNode extends SnippetFolder {
  children: SnippetFolderNode[];
}

export interface SnippetTree {
  folders: SnippetFolderNode[];
  snippetsByFolder: Record<string, Snippet[]>;
}

// --- AI Types ---

export interface AIGenerateRequest {
  field_id: string;
  additional_instructions?: string;
  custom_prompt?: string;
}

export interface AIOptimizeRequest {
  field_id: string;
  instruction: string;
}

export interface AIContext {
  seed_content: string[];
  dependency_contents: Record<string, string>;
  stage_context: string;
}
