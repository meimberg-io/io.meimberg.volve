"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { ProcessCard } from "@/components/process/ProcessCard";
import { NewProcessDialog } from "@/components/process/NewProcessDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { createProcess } from "@/lib/data/processes";
import type { Process } from "@/types";

export type ProcessWithImage = Process & {
  process_models: { header_image: string | null } | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<ProcessWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProcesses = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("processes")
      .select("*, process_models(header_image)")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    setProcesses((data as ProcessWithImage[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProcesses(); // eslint-disable-line react-hooks/set-state-in-effect -- async data fetch
  }, [loadProcesses]);

  const handleCreateProcess = async (name: string, modelId: string) => {
    const process = await createProcess(name, modelId);
    router.push(`/process/${process.id}/seed`);
  };

  const handleArchive = async (id: string) => {
    const supabase = createClient();
    await supabase.from("processes").update({ status: "archived" }).eq("id", id);
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Deine Geschäftsideen im Überblick
        </p>
      </div>

      {/* Process Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewProcessDialog onSubmit={handleCreateProcess} />

          {processes.map((process) => (
            <ProcessCard
              key={process.id}
              process={process}
              onArchive={handleArchive}
            />
          ))}

          {processes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center sm:col-start-2">
              <Lightbulb className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-1 text-lg font-medium">Noch keine Ideen?</h3>
              <p className="text-sm text-muted-foreground">
                Starte deinen ersten Prozess und bringe deine Geschäftsidee auf den Weg.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
