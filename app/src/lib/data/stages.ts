import { createClient } from "@/lib/supabase/client";
import type { StageWithSteps, StepWithFields, Field } from "@/types";

const supabase = createClient();

export async function getStageWithSteps(
  stageId: string
): Promise<StageWithSteps | null> {
  const { data: stage, error: stageError } = await supabase
    .from("stages")
    .select("*")
    .eq("id", stageId)
    .single();

  if (stageError || !stage) return null;

  const { data: steps, error: stepsError } = await supabase
    .from("steps")
    .select("*")
    .eq("stage_id", stageId)
    .order("order_index", { ascending: true });

  if (stepsError) throw stepsError;

  const stepIds = (steps ?? []).map((s) => s.id);
  const { data: fields, error: fieldsError } = await supabase
    .from("fields")
    .select("*")
    .in("step_id", stepIds.length > 0 ? stepIds : ["none"])
    .order("order_index", { ascending: true });

  if (fieldsError) throw fieldsError;

  const fieldsByStep = (fields ?? []).reduce<Record<string, Field[]>>(
    (acc, field) => {
      if (!acc[field.step_id]) acc[field.step_id] = [];
      acc[field.step_id].push(field);
      return acc;
    },
    {}
  );

  const stepsWithFields: StepWithFields[] = (steps ?? []).map((step) => ({
    ...step,
    fields: fieldsByStep[step.id] ?? [],
  }));

  return {
    ...stage,
    steps: stepsWithFields,
  };
}
