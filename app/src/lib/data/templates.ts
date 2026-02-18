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

  let steps: StepTemplate[] = [];
  if (stageIds.length > 0) {
    const { data, error: stepsError } = await supabase
      .from("step_templates")
      .select("*")
      .in("stage_template_id", stageIds)
      .order("order_index", { ascending: true });
    if (stepsError) throw stepsError;
    steps = data ?? [];
  }

  const stepIds = steps.map((s) => s.id);

  let fields: FieldTemplate[] = [];
  if (stepIds.length > 0) {
    const { data, error: fieldsError } = await supabase
      .from("field_templates")
      .select("*")
      .in("step_template_id", stepIds)
      .order("order_index", { ascending: true });
    if (fieldsError) throw fieldsError;
    fields = data ?? [];
  }

  // Get instance counts per stage template
  const stageInstanceCounts = stageIds.length > 0
    ? (await supabase
        .from("stage_instances")
        .select("stage_template_id")
        .in("stage_template_id", stageIds)
      ).data
    : [];

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
  data: Partial<Pick<ProcessModel, "name" | "description" | "header_image">>
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
// BULK CREATE (for AI generation)
// =============================================

export async function bulkCreateStages(
  modelId: string,
  stages: { name: string; description: string }[],
  startIndex?: number
): Promise<void> {
  const offset = startIndex ?? 0;
  for (let i = 0; i < stages.length; i++) {
    const { error } = await supabase
      .from("stage_templates")
      .insert({
        model_id: modelId,
        name: stages[i].name,
        description: stages[i].description,
        order_index: offset + i,
      });
    if (error) throw error;
  }
}

export async function bulkCreateStepsWithFields(
  stageId: string,
  steps: {
    name: string;
    description: string;
    fields: {
      name: string;
      type: string;
      description: string;
      ai_prompt: string;
    }[];
  }[],
  startIndex?: number
): Promise<void> {
  const offset = startIndex ?? 0;
  for (let i = 0; i < steps.length; i++) {
    const { data: step, error: stepError } = await supabase
      .from("step_templates")
      .insert({
        stage_template_id: stageId,
        name: steps[i].name,
        description: steps[i].description,
        order_index: offset + i,
      })
      .select("id")
      .single();

    if (stepError) throw stepError;

    for (let j = 0; j < steps[i].fields.length; j++) {
      const f = steps[i].fields[j];
      const { error: fieldError } = await supabase
        .from("field_templates")
        .insert({
          step_template_id: step.id,
          name: f.name,
          type: f.type,
          description: f.description,
          ai_prompt: f.ai_prompt,
          order_index: j,
        });
      if (fieldError) throw fieldError;
    }
  }
}

export async function clearStages(modelId: string): Promise<void> {
  const { data: stages } = await supabase
    .from("stage_templates")
    .select("id")
    .eq("model_id", modelId);

  if (stages && stages.length > 0) {
    const stageIds = stages.map((s) => s.id);

    const { data: steps } = await supabase
      .from("step_templates")
      .select("id")
      .in("stage_template_id", stageIds);

    if (steps && steps.length > 0) {
      const stepIds = steps.map((s) => s.id);
      await supabase
        .from("field_templates")
        .delete()
        .in("step_template_id", stepIds);

      await supabase
        .from("step_templates")
        .delete()
        .in("stage_template_id", stageIds);
    }

    await supabase
      .from("stage_templates")
      .delete()
      .eq("model_id", modelId);
  }
}

export async function clearSteps(stageId: string): Promise<void> {
  const { data: steps } = await supabase
    .from("step_templates")
    .select("id")
    .eq("stage_template_id", stageId);

  if (steps && steps.length > 0) {
    const stepIds = steps.map((s) => s.id);
    await supabase
      .from("field_templates")
      .delete()
      .in("step_template_id", stepIds);

    await supabase
      .from("step_templates")
      .delete()
      .eq("stage_template_id", stageId);
  }
}

// =============================================
// BULK UPDATE DEPENDENCIES
// =============================================

export async function bulkUpdateDependencies(
  updates: { id: string; dependencies: string[] }[]
): Promise<void> {
  for (const update of updates) {
    const { error } = await supabase
      .from("field_templates")
      .update({ dependencies: update.dependencies.length > 0 ? update.dependencies : null })
      .eq("id", update.id);

    if (error) throw error;
  }
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
// EXPORT / IMPORT
// =============================================

export interface TemplateExport {
  version: 1;
  exportedAt: string;
  template: {
    name: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
    stages: {
      name: string;
      description: string | null;
      icon: string | null;
      order_index: number;
      steps: {
        name: string;
        description: string | null;
        order_index: number;
        fields: {
          _ref: string; // original ID for dependency mapping
          name: string;
          type: string;
          description: string | null;
          ai_prompt: string | null;
          order_index: number;
          dependency_refs: string[]; // original IDs of dependencies
        }[];
      }[];
    }[];
  };
}

export function buildTemplateExport(
  model: ProcessModelWithTemplates
): TemplateExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    template: {
      name: model.name,
      description: model.description,
      metadata: model.metadata,
      stages: model.stages.map((stage) => ({
        name: stage.name,
        description: stage.description,
        icon: stage.icon,
        order_index: stage.order_index,
        steps: stage.steps.map((step) => ({
          name: step.name,
          description: step.description,
          order_index: step.order_index,
          fields: step.fields.map((field) => ({
            _ref: field.id,
            name: field.name,
            type: field.type,
            description: field.description,
            ai_prompt: field.ai_prompt,
            order_index: field.order_index,
            dependency_refs: field.dependencies ?? [],
          })),
        })),
      })),
    },
  };
}

export function downloadTemplateExport(
  model: ProcessModelWithTemplates
): void {
  const payload = buildTemplateExport(model);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${model.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importTemplate(
  file: File
): Promise<string> {
  const text = await file.text();
  const data: TemplateExport = JSON.parse(text);

  if (data.version !== 1) {
    throw new Error("Nicht unterstütztes Export-Format");
  }

  const t = data.template;

  const { data: model, error: modelError } = await supabase
    .from("process_models")
    .insert({
      name: t.name,
      description: t.description,
      metadata: t.metadata ?? {},
    })
    .select()
    .single();

  if (modelError) throw modelError;

  // ref -> new ID mapping for dependency resolution
  const refMap = new Map<string, string>();

  for (const stage of t.stages) {
    const { data: newStage, error: stageError } = await supabase
      .from("stage_templates")
      .insert({
        model_id: model.id,
        name: stage.name,
        description: stage.description,
        icon: stage.icon,
        order_index: stage.order_index,
      })
      .select("id")
      .single();

    if (stageError) throw stageError;

    for (const step of stage.steps) {
      const { data: newStep, error: stepError } = await supabase
        .from("step_templates")
        .insert({
          stage_template_id: newStage.id,
          name: step.name,
          description: step.description,
          order_index: step.order_index,
        })
        .select("id")
        .single();

      if (stepError) throw stepError;

      for (const field of step.fields) {
        const { data: newField, error: fieldError } = await supabase
          .from("field_templates")
          .insert({
            step_template_id: newStep.id,
            name: field.name,
            type: field.type,
            description: field.description,
            ai_prompt: field.ai_prompt,
            order_index: field.order_index,
          })
          .select("id")
          .single();

        if (fieldError) throw fieldError;
        refMap.set(field._ref, newField.id);
      }
    }
  }

  // Remap dependencies
  const depUpdates: { id: string; dependencies: string[] }[] = [];
  for (const stage of t.stages) {
    for (const step of stage.steps) {
      for (const field of step.fields) {
        if (field.dependency_refs.length > 0) {
          const newId = refMap.get(field._ref);
          const mapped = field.dependency_refs
            .map((ref) => refMap.get(ref))
            .filter((id): id is string => !!id);
          if (newId && mapped.length > 0) {
            depUpdates.push({ id: newId, dependencies: mapped });
          }
        }
      }
    }
  }

  if (depUpdates.length > 0) {
    await bulkUpdateDependencies(depUpdates);
  }

  return model.id;
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
