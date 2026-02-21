"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProjectShell } from "@/components/layout/ProjectShell";
import { StageDetail } from "@/components/stage/StageDetail";
import { Skeleton } from "@/components/ui/skeleton";
import type { Process, Stage, StageWithSteps, Field } from "@/types";

export default function StageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const stageId = params.stageId as string;

  const [project, setProject] = useState<Process | null>(null);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [stage, setStage] = useState<StageWithSteps | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: proc } = await supabase
      .from("processes")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!proc) {
      router.push("/projects");
      return;
    }
    setProject(proc);

    const { data: stagesData } = await supabase
      .from("stages")
      .select("*")
      .eq("process_id", projectId)
      .order("order_index", { ascending: true });

    setAllStages(stagesData ?? []);

    const { data: stageData } = await supabase
      .from("stages")
      .select("*")
      .eq("id", stageId)
      .single();

    if (!stageData) {
      router.push(`/project/${projectId}`);
      return;
    }

    const { data: steps } = await supabase
      .from("steps")
      .select("*")
      .eq("stage_id", stageId)
      .order("order_index", { ascending: true });

    const stepIds = (steps ?? []).map((s) => s.id);
    const { data: fields } = await supabase
      .from("fields")
      .select("*")
      .in("step_id", stepIds.length > 0 ? stepIds : ["none"])
      .order("order_index", { ascending: true });

    const fieldsByStep: Record<string, Field[]> = {};
    for (const field of fields ?? []) {
      if (!fieldsByStep[field.step_id]) {
        fieldsByStep[field.step_id] = [];
      }
      fieldsByStep[field.step_id].push(field);
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
  }, [projectId, stageId, router]);

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
    <ProjectShell
      projectId={projectId}
      projectName={project?.name ?? ""}
      stages={allStages}
      currentStageId={stageId}
    >
      {stage && (
        <StageDetail
          stage={stage}
          processId={projectId}
          onFieldUpdate={loadData}
        />
      )}
    </ProjectShell>
  );
}
