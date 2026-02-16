import { createClient } from "@/lib/supabase/client";
import type { Process, ProcessWithStages, StageInstance } from "@/types";

const supabase = createClient();

export async function getProcesses(): Promise<Process[]> {
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getArchivedProcesses(): Promise<Process[]> {
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .eq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProcessWithStages(
  processId: string
): Promise<ProcessWithStages | null> {
  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("*")
    .eq("id", processId)
    .single();

  if (processError) throw processError;
  if (!process) return null;

  const { data: stages, error: stagesError } = await supabase
    .from("stage_instances")
    .select("*")
    .eq("process_id", processId)
    .order("order_index", { ascending: true });

  if (stagesError) throw stagesError;

  return {
    ...process,
    stages: (stages ?? []) as StageInstance[],
  };
}

export async function createProcess(
  name: string,
  modelId: string = "00000000-0000-0000-0000-000000000001"
): Promise<Process> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  // 1. Create the process
  const { data: process, error: processError } = await supabase
    .from("processes")
    .insert({ name, model_id: modelId, user_id: user.id })
    .select()
    .single();

  if (processError) throw processError;

  // 2. Get all templates for instantiation
  const { data: stageTemplates } = await supabase
    .from("stage_templates")
    .select("*")
    .eq("model_id", modelId)
    .order("order_index");

  if (!stageTemplates) throw new Error("Keine Stage-Templates gefunden");

  // 3. Instantiate all stages, steps, fields (with snapshot data)
  for (const stageTemplate of stageTemplates) {
    const { data: stageInstance } = await supabase
      .from("stage_instances")
      .insert({
        process_id: process.id,
        stage_template_id: stageTemplate.id,
        name: stageTemplate.name,
        description: stageTemplate.description,
        icon: stageTemplate.icon,
        order_index: stageTemplate.order_index,
      })
      .select()
      .single();

    if (!stageInstance) continue;

    const { data: stepTemplates } = await supabase
      .from("step_templates")
      .select("*")
      .eq("stage_template_id", stageTemplate.id)
      .order("order_index");

    if (!stepTemplates) continue;

    for (const stepTemplate of stepTemplates) {
      const { data: stepInstance } = await supabase
        .from("step_instances")
        .insert({
          stage_instance_id: stageInstance.id,
          step_template_id: stepTemplate.id,
          name: stepTemplate.name,
          description: stepTemplate.description,
          order_index: stepTemplate.order_index,
        })
        .select()
        .single();

      if (!stepInstance) continue;

      const { data: fieldTemplates } = await supabase
        .from("field_templates")
        .select("*")
        .eq("step_template_id", stepTemplate.id)
        .order("order_index");

      if (!fieldTemplates) continue;

      const fieldInserts = fieldTemplates.map((ft) => ({
        step_instance_id: stepInstance.id,
        field_template_id: ft.id,
        name: ft.name,
        type: ft.type,
        description: ft.description,
        ai_prompt: ft.ai_prompt,
        order_index: ft.order_index,
        dependencies: ft.dependencies,
      }));

      if (fieldInserts.length > 0) {
        await supabase.from("field_instances").insert(fieldInserts);
      }

      // Create task records for task-type fields
      const taskFields = fieldTemplates.filter((ft) => ft.type === "task");
      if (taskFields.length > 0) {
        const { data: taskFieldInstances } = await supabase
          .from("field_instances")
          .select("id, field_template_id")
          .eq("step_instance_id", stepInstance.id)
          .in(
            "field_template_id",
            taskFields.map((tf) => tf.id)
          );

        if (taskFieldInstances) {
          const taskInserts = taskFieldInstances.map((fi) => ({
            field_instance_id: fi.id,
          }));
          await supabase.from("tasks").insert(taskInserts);
        }
      }
    }
  }

  return process;
}

export async function updateProcessStatus(
  processId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("processes")
    .update({ status })
    .eq("id", processId);

  if (error) throw error;
}

export async function updateProcessName(
  processId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from("processes")
    .update({ name })
    .eq("id", processId);

  if (error) throw error;
}

export async function archiveProcess(processId: string): Promise<void> {
  await updateProcessStatus(processId, "archived");
}

export async function unarchiveProcess(processId: string): Promise<void> {
  await updateProcessStatus(processId, "active");
}
