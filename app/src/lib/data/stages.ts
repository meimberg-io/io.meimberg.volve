import { createClient } from "@/lib/supabase/client";
import type { StageWithSteps, StepInstanceWithFields, FieldInstance } from "@/types";

const supabase = createClient();

export async function getStageWithSteps(
  stageInstanceId: string
): Promise<StageWithSteps | null> {
  // Get stage instance (snapshot columns have all display data)
  const { data: stage, error: stageError } = await supabase
    .from("stage_instances")
    .select("*")
    .eq("id", stageInstanceId)
    .single();

  if (stageError || !stage) return null;

  // Get step instances (snapshot columns have all display data)
  const { data: steps, error: stepsError } = await supabase
    .from("step_instances")
    .select("*")
    .eq("stage_instance_id", stageInstanceId)
    .order("order_index", { ascending: true });

  if (stepsError) throw stepsError;

  // Get field instances for all steps (snapshot columns have all display data)
  const stepIds = (steps ?? []).map((s) => s.id);
  const { data: fields, error: fieldsError } = await supabase
    .from("field_instances")
    .select("*")
    .in("step_instance_id", stepIds)
    .order("order_index", { ascending: true });

  if (fieldsError) throw fieldsError;

  // Group fields by step
  const fieldsByStep = (fields ?? []).reduce<Record<string, FieldInstance[]>>(
    (acc, field) => {
      if (!acc[field.step_instance_id]) acc[field.step_instance_id] = [];
      acc[field.step_instance_id].push(field);
      return acc;
    },
    {}
  );

  const stepsWithFields: StepInstanceWithFields[] = (steps ?? []).map((step) => ({
    ...step,
    fields: fieldsByStep[step.id] ?? [],
  }));

  return {
    ...stage,
    steps: stepsWithFields,
  };
}

export async function getStageInstanceByTemplateAndProcess(
  processId: string,
  stageTemplateId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("stage_instances")
    .select("id")
    .eq("process_id", processId)
    .eq("stage_template_id", stageTemplateId)
    .single();

  return data?.id ?? null;
}
