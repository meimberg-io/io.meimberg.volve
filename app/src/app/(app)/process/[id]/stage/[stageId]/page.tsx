"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessShell } from "@/components/layout/ProcessShell";
import { StageDetail } from "@/components/stage/StageDetail";
import { Skeleton } from "@/components/ui/skeleton";
import type { Process, StageInstance, StageWithSteps, FieldInstance } from "@/types";

export default function StageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const processId = params.id as string;
  const stageId = params.stageId as string;

  const [process, setProcess] = useState<Process | null>(null);
  const [allStages, setAllStages] = useState<StageInstance[]>([]);
  const [stage, setStage] = useState<StageWithSteps | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Load process
    const { data: proc } = await supabase
      .from("processes")
      .select("*")
      .eq("id", processId)
      .single();

    if (!proc) {
      router.push("/dashboard");
      return;
    }
    setProcess(proc);

    // Load all stages for navigation
    const { data: stagesData } = await supabase
      .from("stage_instances")
      .select("*, template:stage_templates(*)")
      .eq("process_id", processId)
      .order("created_at", { ascending: true });

    setAllStages(stagesData ?? []);

    // Load current stage with steps and fields
    const { data: stageData } = await supabase
      .from("stage_instances")
      .select("*, template:stage_templates(*)")
      .eq("id", stageId)
      .single();

    if (!stageData) {
      router.push(`/process/${processId}`);
      return;
    }

    // Get steps with templates
    const { data: steps } = await supabase
      .from("step_instances")
      .select("*, template:step_templates(*)")
      .eq("stage_instance_id", stageId)
      .order("created_at", { ascending: true });

    // Get all fields for these steps
    const stepIds = (steps ?? []).map((s) => s.id);
    const { data: fields } = await supabase
      .from("field_instances")
      .select("*, template:field_templates(*)")
      .in("step_instance_id", stepIds.length > 0 ? stepIds : ["none"])
      .order("created_at", { ascending: true });

    // Group fields by step
    const fieldsByStep: Record<string, FieldInstance[]> = {};
    for (const field of fields ?? []) {
      if (!fieldsByStep[field.step_instance_id]) {
        fieldsByStep[field.step_instance_id] = [];
      }
      fieldsByStep[field.step_instance_id].push(field);
    }

    const stepsWithFields = (steps ?? []).map((step) => ({
      ...step,
      fields: fieldsByStep[step.id] ?? [],
    }));

    setStage({
      ...stageData,
      steps: stepsWithFields,
    });

    setLoading(false);
  }, [processId, stageId, router]);

  useEffect(() => {
    loadData(); // eslint-disable-line react-hooks/set-state-in-effect -- async data fetch
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <ProcessShell
      processId={processId}
      processName={process?.name ?? ""}
      stages={allStages}
      currentStageId={stageId}
    >
      {stage && (
        <StageDetail
          stage={stage}
          processId={processId}
          onFieldUpdate={loadData}
        />
      )}
    </ProcessShell>
  );
}
