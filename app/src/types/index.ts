// =============================================
// Volve Domain Types
// =============================================

// --- Enums ---

export type ProcessStatus = "seeding" | "active" | "completed" | "archived";

export type StageStatus = "locked" | "open" | "in_progress" | "completed";

export type StepStatus = "open" | "in_progress" | "completed";

export type FieldStatus = "empty" | "open" | "closed";

export type FieldType = "text" | "long_text" | "file" | "file_list" | "task";

export type TaskStatus =
  | "planned"
  | "delegated"
  | "in_progress"
  | "done"
  | "accepted";

export type TaskType = "self" | "delegated" | "agent";

export type AIActionSource = "generate" | "generate_advanced" | "optimize" | "manual";

// --- Template Layer (read-only, predefined models) ---

export interface ProcessModel {
  id: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StageTemplate {
  id: string;
  model_id: string;
  name: string;
  description: string | null;
  order_index: number;
  icon: string | null;
  created_at: string;
}

export interface StepTemplate {
  id: string;
  stage_template_id: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface FieldTemplate {
  id: string;
  step_template_id: string;
  name: string;
  type: FieldType;
  description: string | null;
  ai_prompt: string | null;
  order_index: number;
  dependencies: string[] | null; // IDs of other field templates
  created_at: string;
}

// --- Instance Layer (user data) ---

export interface Process {
  id: string;
  user_id: string;
  name: string;
  model_id: string;
  status: ProcessStatus;
  progress: number; // 0-100
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

export interface StageInstance {
  id: string;
  process_id: string;
  stage_template_id: string;
  status: StageStatus;
  progress: number; // 0-100
  created_at: string;
  updated_at: string;
  // Joined data
  template?: StageTemplate;
}

export interface StepInstance {
  id: string;
  stage_instance_id: string;
  step_template_id: string;
  status: StepStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  template?: StepTemplate;
  fields?: FieldInstance[];
}

export interface FieldInstance {
  id: string;
  step_instance_id: string;
  field_template_id: string;
  content: string | null;
  status: FieldStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  template?: FieldTemplate;
}

export interface FieldVersion {
  id: string;
  field_instance_id: string;
  content: string;
  source: AIActionSource;
  created_at: string;
}

export interface Task {
  id: string;
  field_instance_id: string;
  description: string;
  assignee: string | null;
  type: TaskType;
  status: TaskStatus;
  result: string | null;
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

// --- Composite Types (for UI) ---

export interface ProcessWithStages extends Process {
  stages: StageInstance[];
  model?: ProcessModel;
}

export interface StageWithSteps extends StageInstance {
  steps: StepInstanceWithFields[];
}

export interface StepInstanceWithFields extends StepInstance {
  fields: FieldInstance[];
}

// --- AI Types ---

export interface AIGenerateRequest {
  field_instance_id: string;
  additional_instructions?: string;
  custom_prompt?: string;
}

export interface AIOptimizeRequest {
  field_instance_id: string;
  instruction: string;
}

export interface AIContext {
  seed_content: string[];
  dependency_contents: Record<string, string>;
  stage_context: string;
}
