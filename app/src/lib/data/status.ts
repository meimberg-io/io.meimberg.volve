import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function recalculateStatusCascade(
  fieldId: string
): Promise<void> {
  const { data: field } = await supabase
    .from("fields")
    .select("step_id")
    .eq("id", fieldId)
    .single();

  if (!field) return;

  const { data: stepFields } = await supabase
    .from("fields")
    .select("status, type, dossier_field_ids")
    .eq("step_id", field.step_id);

  const dossierFields = (stepFields ?? []).filter(
    (f) => f.type === "dossier" && f.dossier_field_ids?.length
  );

  let refFieldStatusMap: Record<string, string> = {};
  if (dossierFields.length > 0) {
    const allRefIds = [...new Set(dossierFields.flatMap((f) => f.dossier_field_ids!))];
    const { data: refFields } = await supabase
      .from("fields")
      .select("id, status")
      .in("id", allRefIds);
    refFieldStatusMap = Object.fromEntries(
      (refFields ?? []).map((f) => [f.id, f.status])
    );
  }

  const isFieldDone = (f: { status: string | null; type: string; dossier_field_ids: string[] | null }) => {
    if (f.type === "dossier" && f.dossier_field_ids?.length) {
      return f.dossier_field_ids.every(
        (id) => refFieldStatusMap[id] === "closed" || refFieldStatusMap[id] === "skipped"
      );
    }
    return f.status === "closed" || f.status === "skipped";
  };

  const allFieldsDone = stepFields?.every(isFieldDone) ?? false;
  const anyFieldOpen =
    stepFields?.some((f) => f.status !== "empty" || (f.type === "dossier" && f.dossier_field_ids?.length)) ?? false;

  const stepStatus = allFieldsDone
    ? "completed"
    : anyFieldOpen
      ? "in_progress"
      : "open";

  await supabase
    .from("steps")
    .update({ status: stepStatus })
    .eq("id", field.step_id);

  const { data: step } = await supabase
    .from("steps")
    .select("stage_id")
    .eq("id", field.step_id)
    .single();

  if (!step) return;

  const { data: stageSteps } = await supabase
    .from("steps")
    .select("status")
    .eq("stage_id", step.stage_id);

  const allStepsCompleted =
    stageSteps?.every((s) => s.status === "completed") ?? false;
  const anyStepInProgress =
    stageSteps?.some(
      (s) => s.status === "in_progress" || s.status === "completed"
    ) ?? false;

  const stageStatus = allStepsCompleted
    ? "completed"
    : anyStepInProgress
      ? "in_progress"
      : "open";

  const stageProgress = stageSteps
    ? (stageSteps.filter((s) => s.status === "completed").length /
        stageSteps.length) *
      100
    : 0;

  await supabase
    .from("stages")
    .update({ status: stageStatus, progress: stageProgress })
    .eq("id", step.stage_id);

  const { data: stage } = await supabase
    .from("stages")
    .select("process_id")
    .eq("id", step.stage_id)
    .single();

  if (!stage) return;

  const { data: processStages } = await supabase
    .from("stages")
    .select("status")
    .eq("process_id", stage.process_id);

  const allStagesCompleted =
    processStages?.every((s) => s.status === "completed") ?? false;

  const { data: allFields } = await supabase
    .from("fields")
    .select("status, step:steps(stage:stages(process_id))")
    .filter("step.stage.process_id", "eq", stage.process_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processFields = (allFields ?? []).filter((f: any) => {
    return f.step?.stage?.process_id === stage.process_id;
  });

  const totalFields = processFields.length;
  const doneFields = processFields.filter(
    (f) => f.status === "closed" || f.status === "skipped"
  ).length;
  const processProgress =
    totalFields > 0 ? (doneFields / totalFields) * 100 : 0;

  const processStatus = allStagesCompleted ? "completed" : "active";

  await supabase
    .from("processes")
    .update({ status: processStatus, progress: processProgress })
    .eq("id", stage.process_id);
}
