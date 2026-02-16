import { createClient } from "@/lib/supabase/client";
import type {
  ProcessModel,
  ProcessModelWithTemplates,
  StageTemplate,
  StepTemplate,
  FieldTemplate,
  StageTemplateWithSteps,
  StepTemplateWithFields,
} from "@/types";

const supabase = createClient();

// =============================================
// READ
// =============================================

export async function getProcessModels(): Promise<ProcessModel[]> {
  const { data, error } = await supabase
    .from("process_models")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProcessModelWithTemplates(
  modelId: string
): Promise<ProcessModelWithTemplates | null> {
  const { data: model, error: modelError } = await supabase
    .from("process_models")
    .select("*")
    .eq("id", modelId)
    .single();

  if (modelError || !model) return null;

  const { data: stages, error: stagesError } = await supabase
    .from("stage_templates")
    .select("*")
    .eq("model_id", modelId)
    .order("order_index", { ascending: true });

  if (stagesError) throw stagesError;

  const stageIds = (stages ?? []).map((s) => s.id);

  const { data: steps, error: stepsError } = await supabase
    .from("step_templates")
    .select("*")
    .in("stage_template_id", stageIds.length > 0 ? stageIds : ["__none__"])
    .order("order_index", { ascending: true });

  if (stepsError) throw stepsError;

  const stepIds = (steps ?? []).map((s) => s.id);

  const { data: fields, error: fieldsError } = await supabase
    .from("field_templates")
    .select("*")
    .in("step_template_id", stepIds.length > 0 ? stepIds : ["__none__"])
    .order("order_index", { ascending: true });

  if (fieldsError) throw fieldsError;

  // Get instance counts per stage template
  const { data: stageInstanceCounts } = await supabase
    .from("stage_instances")
    .select("stage_template_id")
    .in("stage_template_id", stageIds.length > 0 ? stageIds : ["__none__"]);

  const stageCounts: Record<string, number> = {};
  for (const row of stageInstanceCounts ?? []) {
    stageCounts[row.stage_template_id] =
      (stageCounts[row.stage_template_id] ?? 0) + 1;
  }

  // Group fields by step
  const fieldsByStep: Record<string, FieldTemplate[]> = {};
  for (const field of fields ?? []) {
    if (!fieldsByStep[field.step_template_id])
      fieldsByStep[field.step_template_id] = [];
    fieldsByStep[field.step_template_id].push(field);
  }

  // Group steps by stage
  const stepsByStage: Record<string, StepTemplateWithFields[]> = {};
  for (const step of steps ?? []) {
    if (!stepsByStage[step.stage_template_id])
      stepsByStage[step.stage_template_id] = [];
    stepsByStage[step.stage_template_id].push({
      ...step,
      fields: fieldsByStep[step.id] ?? [],
    });
  }

  const stagesWithSteps: StageTemplateWithSteps[] = (stages ?? []).map(
    (stage) => ({
      ...stage,
      steps: stepsByStage[stage.id] ?? [],
      instance_count: stageCounts[stage.id] ?? 0,
    })
  );

  return {
    ...model,
    stages: stagesWithSteps,
  };
}

// =============================================
// CREATE
// =============================================

export async function createProcessModel(
  name: string
): Promise<ProcessModel> {
  const { data, error } = await supabase
    .from("process_models")
    .insert({ name, description: null, icon: "file-text" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createStageTemplate(
  modelId: string,
  name: string
): Promise<StageTemplate> {
  // Get next order_index
  const { data: existing } = await supabase
    .from("stage_templates")
    .select("order_index")
    .eq("model_id", modelId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing && existing.length > 0
    ? existing[0].order_index + 1
    : 0;

  const { data, error } = await supabase
    .from("stage_templates")
    .insert({
      model_id: modelId,
      name,
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createStepTemplate(
  stageTemplateId: string,
  name: string
): Promise<StepTemplate> {
  const { data: existing } = await supabase
    .from("step_templates")
    .select("order_index")
    .eq("stage_template_id", stageTemplateId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing && existing.length > 0
    ? existing[0].order_index + 1
    : 0;

  const { data, error } = await supabase
    .from("step_templates")
    .insert({
      stage_template_id: stageTemplateId,
      name,
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createFieldTemplate(
  stepTemplateId: string,
  name: string,
  type: string = "long_text"
): Promise<FieldTemplate> {
  const { data: existing } = await supabase
    .from("field_templates")
    .select("order_index")
    .eq("step_template_id", stepTemplateId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing && existing.length > 0
    ? existing[0].order_index + 1
    : 0;

  const { data, error } = await supabase
    .from("field_templates")
    .insert({
      step_template_id: stepTemplateId,
      name,
      type,
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// UPDATE
// =============================================

export async function updateProcessModel(
  id: string,
  data: Partial<Pick<ProcessModel, "name" | "description">>
): Promise<void> {
  const { error } = await supabase
    .from("process_models")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function updateStageTemplate(
  id: string,
  data: Partial<Pick<StageTemplate, "name" | "description" | "icon">>
): Promise<void> {
  const { error } = await supabase
    .from("stage_templates")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function updateStepTemplate(
  id: string,
  data: Partial<Pick<StepTemplate, "name" | "description">>
): Promise<void> {
  const { error } = await supabase
    .from("step_templates")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function updateFieldTemplate(
  id: string,
  data: Partial<
    Pick<
      FieldTemplate,
      "name" | "description" | "type" | "ai_prompt" | "dependencies"
    >
  >
): Promise<void> {
  const { error } = await supabase
    .from("field_templates")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

// =============================================
// DELETE
// =============================================

export async function deleteProcessModel(id: string): Promise<void> {
  const { error } = await supabase
    .from("process_models")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteStageTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("stage_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteStepTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("step_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteFieldTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("field_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =============================================
// REORDER
// =============================================

export async function reorderStageTemplates(
  modelId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("stage_templates")
      .update({ order_index: i })
      .eq("id", orderedIds[i])
      .eq("model_id", modelId);

    if (error) throw error;
  }
}

export async function reorderStepTemplates(
  stageTemplateId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("step_templates")
      .update({ order_index: i })
      .eq("id", orderedIds[i])
      .eq("stage_template_id", stageTemplateId);

    if (error) throw error;
  }
}

export async function reorderFieldTemplates(
  stepTemplateId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("field_templates")
      .update({ order_index: i })
      .eq("id", orderedIds[i])
      .eq("step_template_id", stepTemplateId);

    if (error) throw error;
  }
}

// =============================================
// INSTANCE COUNT (for delete-protection UI)
// =============================================

export async function getTemplateInstanceCount(
  templateType: "stage" | "step" | "field",
  templateId: string
): Promise<number> {
  const table =
    templateType === "stage"
      ? "stage_instances"
      : templateType === "step"
        ? "step_instances"
        : "field_instances";

  const fk =
    templateType === "stage"
      ? "stage_template_id"
      : templateType === "step"
        ? "step_template_id"
        : "field_template_id";

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(fk, templateId);

  if (error) throw error;
  return count ?? 0;
}
