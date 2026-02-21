import { createClient } from "@/lib/supabase/client";
import type {
  Process,
  Stage,
  Step,
  Field,
  StageWithSteps,
  StepWithFields,
} from "@/types";

const supabase = createClient();

// =============================================
// Composite type for the process editor
// =============================================

export type ProcessWithStages = Process & {
  stages: (StageWithSteps & { instance_count?: number })[];
};

// =============================================
// READ
// =============================================

export async function getProcesses(): Promise<Process[]> {
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .eq("is_process", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProcessWithFullTree(
  processId: string
): Promise<ProcessWithStages | null> {
  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("*")
    .eq("id", processId)
    .single();

  if (processError || !process) return null;

  const { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select("*")
    .eq("process_id", processId)
    .order("order_index", { ascending: true });

  if (stagesError) throw stagesError;

  const stageIds = (stages ?? []).map((s) => s.id);

  let steps: Step[] = [];
  if (stageIds.length > 0) {
    const { data, error: stepsError } = await supabase
      .from("steps")
      .select("*")
      .in("stage_id", stageIds)
      .order("order_index", { ascending: true });
    if (stepsError) throw stepsError;
    steps = data ?? [];
  }

  const stepIds = steps.map((s) => s.id);

  let fields: Field[] = [];
  if (stepIds.length > 0) {
    const { data, error: fieldsError } = await supabase
      .from("fields")
      .select("*")
      .in("step_id", stepIds)
      .order("order_index", { ascending: true });
    if (fieldsError) throw fieldsError;
    fields = data ?? [];
  }

  const fieldsByStep: Record<string, Field[]> = {};
  for (const field of fields) {
    if (!fieldsByStep[field.step_id]) fieldsByStep[field.step_id] = [];
    fieldsByStep[field.step_id].push(field);
  }

  const stepsByStage: Record<string, StepWithFields[]> = {};
  for (const step of steps) {
    if (!stepsByStage[step.stage_id]) stepsByStage[step.stage_id] = [];
    stepsByStage[step.stage_id].push({
      ...step,
      fields: fieldsByStep[step.id] ?? [],
    });
  }

  const stagesWithSteps = (stages ?? []).map((stage) => ({
    ...stage,
    steps: stepsByStage[stage.id] ?? [],
    instance_count: 0,
  }));

  return {
    ...process,
    stages: stagesWithSteps,
  };
}

// =============================================
// CREATE
// =============================================

export async function createProcess(name: string): Promise<Process> {
  const { data, error } = await supabase
    .from("processes")
    .insert({
      name,
      description: null,
      is_process: true,
      status: "process",
      progress: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createStage(
  processId: string,
  name: string
): Promise<Stage> {
  const { data: existing } = await supabase
    .from("stages")
    .select("order_index")
    .eq("process_id", processId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex =
    existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data, error } = await supabase
    .from("stages")
    .insert({
      process_id: processId,
      name,
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createStep(
  stageId: string,
  name: string
): Promise<Step> {
  const { data: existing } = await supabase
    .from("steps")
    .select("order_index")
    .eq("stage_id", stageId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex =
    existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data, error } = await supabase
    .from("steps")
    .insert({
      stage_id: stageId,
      name,
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createField(
  stepId: string,
  name: string,
  type: string = "long_text"
): Promise<Field> {
  const { data: existing } = await supabase
    .from("fields")
    .select("order_index")
    .eq("step_id", stepId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex =
    existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data, error } = await supabase
    .from("fields")
    .insert({
      step_id: stepId,
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

export async function updateProcess(
  id: string,
  data: Partial<Pick<Process, "name" | "description" | "header_image" | "ai_system_prompt">>
): Promise<void> {
  const { error } = await supabase
    .from("processes")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function updateStage(
  id: string,
  data: Partial<Pick<Stage, "name" | "description" | "icon" | "ai_system_prompt">>
): Promise<void> {
  const { error } = await supabase
    .from("stages")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function updateStep(
  id: string,
  data: Partial<Pick<Step, "name" | "description">>
): Promise<void> {
  const { error } = await supabase
    .from("steps")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function updateField(
  id: string,
  data: Partial<
    Pick<Field, "name" | "description" | "type" | "ai_prompt" | "dependencies">
  >
): Promise<void> {
  const { error } = await supabase
    .from("fields")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

// =============================================
// DELETE
// =============================================

export async function deleteProcess(id: string): Promise<void> {
  const { error } = await supabase
    .from("processes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteStage(id: string): Promise<void> {
  const { error } = await supabase.from("stages").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteStep(id: string): Promise<void> {
  const { error } = await supabase.from("steps").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteField(id: string): Promise<void> {
  const { error } = await supabase.from("fields").delete().eq("id", id);
  if (error) throw error;
}

// =============================================
// BULK CREATE (for AI generation)
// =============================================

export async function bulkCreateStages(
  processId: string,
  stages: { name: string; description: string }[],
  startIndex?: number
): Promise<void> {
  const offset = startIndex ?? 0;
  for (let i = 0; i < stages.length; i++) {
    const { error } = await supabase.from("stages").insert({
      process_id: processId,
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
      .from("steps")
      .insert({
        stage_id: stageId,
        name: steps[i].name,
        description: steps[i].description,
        order_index: offset + i,
      })
      .select("id")
      .single();

    if (stepError) throw stepError;

    for (let j = 0; j < steps[i].fields.length; j++) {
      const f = steps[i].fields[j];
      const { error: fieldError } = await supabase.from("fields").insert({
        step_id: step.id,
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

export async function clearStages(processId: string): Promise<void> {
  const { error } = await supabase
    .from("stages")
    .delete()
    .eq("process_id", processId);

  if (error) throw error;
}

export async function clearSteps(stageId: string): Promise<void> {
  const { error } = await supabase
    .from("steps")
    .delete()
    .eq("stage_id", stageId);

  if (error) throw error;
}

// =============================================
// BULK UPDATE DEPENDENCIES
// =============================================

export async function bulkUpdateDependencies(
  updates: { id: string; dependencies: string[] }[]
): Promise<void> {
  for (const update of updates) {
    const { error } = await supabase
      .from("fields")
      .update({
        dependencies:
          update.dependencies.length > 0 ? update.dependencies : null,
      })
      .eq("id", update.id);

    if (error) throw error;
  }
}

// =============================================
// REORDER
// =============================================

export async function reorderStages(
  processId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("stages")
      .update({ order_index: i })
      .eq("id", orderedIds[i])
      .eq("process_id", processId);

    if (error) throw error;
  }
}

export async function reorderSteps(
  stageId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("steps")
      .update({ order_index: i })
      .eq("id", orderedIds[i])
      .eq("stage_id", stageId);

    if (error) throw error;
  }
}

export async function reorderFields(
  stepId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("fields")
      .update({ order_index: i })
      .eq("id", orderedIds[i])
      .eq("step_id", stepId);

    if (error) throw error;
  }
}

// =============================================
// CROSS-CONTAINER MOVE
// =============================================

export async function moveStep(
  stepId: string,
  targetStageId: string,
  orderedIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from("steps")
    .update({ stage_id: targetStageId })
    .eq("id", stepId);
  if (error) throw error;

  for (let i = 0; i < orderedIds.length; i++) {
    const { error: reorderError } = await supabase
      .from("steps")
      .update({ order_index: i, stage_id: targetStageId })
      .eq("id", orderedIds[i]);
    if (reorderError) throw reorderError;
  }
}

export async function moveField(
  fieldId: string,
  targetStepId: string,
  orderedIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from("fields")
    .update({ step_id: targetStepId })
    .eq("id", fieldId);
  if (error) throw error;

  for (let i = 0; i < orderedIds.length; i++) {
    const { error: reorderError } = await supabase
      .from("fields")
      .update({ order_index: i, step_id: targetStepId })
      .eq("id", orderedIds[i]);
    if (reorderError) throw reorderError;
  }
}

// =============================================
// EXPORT / IMPORT
// =============================================

export interface ProcessExport {
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
          _ref: string;
          name: string;
          type: string;
          description: string | null;
          ai_prompt: string | null;
          order_index: number;
          dependency_refs: string[];
        }[];
      }[];
    }[];
  };
}

export function buildProcessExport(process: ProcessWithStages): ProcessExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    template: {
      name: process.name,
      description: process.description,
      metadata: process.metadata,
      stages: process.stages.map((stage) => ({
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

export function downloadProcessExport(process: ProcessWithStages): void {
  const payload = buildProcessExport(process);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${process.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProcess(file: File): Promise<string> {
  const text = await file.text();
  const data: ProcessExport = JSON.parse(text);

  if (data.version !== 1) {
    throw new Error("Nicht unterstütztes Export-Format");
  }

  const t = data.template;

  const { data: process, error: processError } = await supabase
    .from("processes")
    .insert({
      name: t.name,
      description: t.description,
      metadata: t.metadata ?? {},
      is_process: true,
      status: "process",
      progress: 0,
    })
    .select()
    .single();

  if (processError) throw processError;

  const refMap = new Map<string, string>();

  for (const stage of t.stages) {
    const { data: newStage, error: stageError } = await supabase
      .from("stages")
      .insert({
        process_id: process.id,
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
        .from("steps")
        .insert({
          stage_id: newStage.id,
          name: step.name,
          description: step.description,
          order_index: step.order_index,
        })
        .select("id")
        .single();

      if (stepError) throw stepError;

      for (const field of step.fields) {
        const { data: newField, error: fieldError } = await supabase
          .from("fields")
          .insert({
            step_id: newStep.id,
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

  return process.id;
}

// =============================================
// DEEP COPY (for creating projects from processes, or processes from projects)
// =============================================

export async function copyProcess(
  sourceId: string,
  opts: { is_process: boolean; name: string; userId?: string }
): Promise<Process> {
  const source = await getProcessWithFullTree(sourceId);
  if (!source) throw new Error("Source process not found");

  let userId = opts.userId ?? null;
  if (!userId && !opts.is_process) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  const { data: newProcess, error: processError } = await supabase
    .from("processes")
    .insert({
      name: opts.name,
      description: source.description,
      header_image: source.header_image,
      metadata: source.metadata ?? {},
      ai_system_prompt: source.ai_system_prompt,
      is_process: opts.is_process,
      source_process_id: source.is_process ? source.id : source.source_process_id,
      user_id: userId,
      status: opts.is_process ? "process" : "seeding",
      progress: 0,
    })
    .select()
    .single();

  if (processError) throw processError;

  const fieldIdMap = new Map<string, string>();

  for (const stage of source.stages) {
    const { data: newStage, error: stageError } = await supabase
      .from("stages")
      .insert({
        process_id: newProcess.id,
        name: stage.name,
        description: stage.description,
        icon: stage.icon,
        ai_system_prompt: stage.ai_system_prompt,
        order_index: stage.order_index,
        status: opts.is_process ? null : "open",
        progress: opts.is_process ? null : 0,
      })
      .select("id")
      .single();

    if (stageError) throw stageError;

    for (const step of stage.steps) {
      const { data: newStep, error: stepError } = await supabase
        .from("steps")
        .insert({
          stage_id: newStage.id,
          name: step.name,
          description: step.description,
          order_index: step.order_index,
          status: opts.is_process ? null : "open",
        })
        .select("id")
        .single();

      if (stepError) throw stepError;

      for (const field of step.fields) {
        const { data: newField, error: fieldError } = await supabase
          .from("fields")
          .insert({
            step_id: newStep.id,
            name: field.name,
            type: field.type,
            description: field.description,
            ai_prompt: field.ai_prompt,
            order_index: field.order_index,
            dependencies: [],
            content: null,
            status: opts.is_process ? null : "empty",
          })
          .select("id")
          .single();

        if (fieldError) throw fieldError;
        fieldIdMap.set(field.id, newField.id);

        if (!opts.is_process && field.type === "task") {
          await supabase.from("tasks").insert({ field_id: newField.id });
        }
      }
    }
  }

  const depUpdates: { id: string; dependencies: string[] }[] = [];
  for (const stage of source.stages) {
    for (const step of stage.steps) {
      for (const field of step.fields) {
        if (field.dependencies && field.dependencies.length > 0) {
          const newFieldId = fieldIdMap.get(field.id);
          const mapped = field.dependencies
            .map((depId) => fieldIdMap.get(depId))
            .filter((id): id is string => !!id);
          if (newFieldId && mapped.length > 0) {
            depUpdates.push({ id: newFieldId, dependencies: mapped });
          }
        }
      }
    }
  }

  if (depUpdates.length > 0) {
    await bulkUpdateDependencies(depUpdates);
  }

  return newProcess;
}
