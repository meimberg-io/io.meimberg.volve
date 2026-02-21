"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProjectShell } from "@/components/layout/ProjectShell";
import { StageOverview } from "@/components/stage/StageOverview";
import { Skeleton } from "@/components/ui/skeleton";
import type { Process, Stage } from "@/types";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Process | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
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

    if (proc.status === "seeding") {
      router.push(`/project/${projectId}/seed`);
      return;
    }

    setProject(proc);

    const { data: stageData } = await supabase
      .from("stages")
      .select("*")
      .eq("process_id", projectId)
      .order("order_index", { ascending: true });

    setStages(stageData ?? []);
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    loadData(); // eslint-disable-line react-hooks/set-state-in-effect -- async data fetch
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProjectShell
      projectId={projectId}
      projectName={project?.name ?? ""}
      stages={stages}
    >
      <StageOverview
        projectId={projectId}
        stages={stages}
        projectProgress={project?.progress ?? 0}
      />
    </ProjectShell>
  );
}
