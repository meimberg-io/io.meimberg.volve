"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessShell } from "@/components/layout/ProcessShell";
import { StageOverview } from "@/components/stage/StageOverview";
import { Skeleton } from "@/components/ui/skeleton";
import type { Process, StageInstance } from "@/types";

export default function ProcessPage() {
  const params = useParams();
  const router = useRouter();
  const processId = params.id as string;

  const [process, setProcess] = useState<Process | null>(null);
  const [stages, setStages] = useState<StageInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: proc } = await supabase
      .from("processes")
      .select("*")
      .eq("id", processId)
      .single();

    if (!proc) {
      router.push("/dashboard");
      return;
    }

    if (proc.status === "seeding") {
      router.push(`/process/${processId}/seed`);
      return;
    }

    setProcess(proc);

    const { data: stageData } = await supabase
      .from("stage_instances")
      .select(`
        *,
        template:stage_templates(*)
      `)
      .eq("process_id", processId)
      .order("created_at", { ascending: true });

    setStages(stageData ?? []);
    setLoading(false);
  }, [processId, router]);

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
    <ProcessShell
      processId={processId}
      processName={process?.name ?? ""}
      stages={stages}
    >
      <StageOverview
        processId={processId}
        stages={stages}
        processProgress={process?.progress ?? 0}
      />
    </ProcessShell>
  );
}
