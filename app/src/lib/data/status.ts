import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * Recalculate status cascade: field → step → stage → process
 */
export async function recalculateStatusCascade(
  fieldInstanceId: string
): Promise<void> {
  // 1. Get field's step instance
  const { data: field } = await supabase
    .from("field_instances")
    .select("step_instance_id")
    .eq("id", fieldInstanceId)
    .single();

  if (!field) return;

  // 2. Check if all fields in the step are closed
  const { data: stepFields } = await supabase
    .from("field_instances")
    .select("status")
    .eq("step_instance_id", field.step_instance_id);

  const allFieldsClosed = stepFields?.every((f) => f.status === "closed") ?? false;
  const anyFieldOpen = stepFields?.some((f) => f.status !== "empty") ?? false;

  const stepStatus = allFieldsClosed
    ? "completed"
    : anyFieldOpen
      ? "in_progress"
      : "open";

  await supabase
    .from("step_instances")
    .update({ status: stepStatus })
    .eq("id", field.step_instance_id);

  // 3. Get step's stage instance
  const { data: step } = await supabase
    .from("step_instances")
    .select("stage_instance_id")
    .eq("id", field.step_instance_id)
    .single();

  if (!step) return;

  // 4. Check if all steps in the stage are completed
  const { data: stageSteps } = await supabase
    .from("step_instances")
    .select("status")
    .eq("stage_instance_id", step.stage_instance_id);

  const allStepsCompleted = stageSteps?.every((s) => s.status === "completed") ?? false;
  const anyStepInProgress = stageSteps?.some(
    (s) => s.status === "in_progress" || s.status === "completed"
  ) ?? false;

  const stageStatus = allStepsCompleted
    ? "completed"
    : anyStepInProgress
      ? "in_progress"
      : "open";

  const stageProgress = stageSteps
    ? (stageSteps.filter((s) => s.status === "completed").length / stageSteps.length) * 100
    : 0;

  await supabase
    .from("stage_instances")
    .update({ status: stageStatus, progress: stageProgress })
    .eq("id", step.stage_instance_id);

  // 5. Get stage's process
  const { data: stage } = await supabase
    .from("stage_instances")
    .select("process_id")
    .eq("id", step.stage_instance_id)
    .single();

  if (!stage) return;

  // 6. Check if all stages are completed
  const { data: processStages } = await supabase
    .from("stage_instances")
    .select("status")
    .eq("process_id", stage.process_id);

  const allStagesCompleted = processStages?.every((s) => s.status === "completed") ?? false;

  // Calculate overall process progress
  const { data: allFields } = await supabase
    .from("field_instances")
    .select("status, step_instance:step_instances(stage_instance:stage_instances(process_id))")
    .filter("step_instance.stage_instance.process_id", "eq", stage.process_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processFields = (allFields ?? []).filter((f: any) => {
    return f.step_instance?.stage_instance?.process_id === stage.process_id;
  });

  const totalFields = processFields.length;
  const closedFields = processFields.filter((f) => f.status === "closed").length;
  const processProgress = totalFields > 0 ? (closedFields / totalFields) * 100 : 0;

  const processStatus = allStagesCompleted ? "completed" : "active";

  await supabase
    .from("processes")
    .update({ status: processStatus, progress: processProgress })
    .eq("id", stage.process_id);
}
