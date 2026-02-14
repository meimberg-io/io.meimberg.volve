"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { ProcessCard } from "@/components/process/ProcessCard";
import { NewProcessDialog } from "@/components/process/NewProcessDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Process } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProcesses = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("processes")
      .select("*")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    setProcesses(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const handleCreateProcess = async (name: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Create process
    const { data: process, error: processError } = await supabase
      .from("processes")
      .insert({
        name,
        model_id: "00000000-0000-0000-0000-000000000001",
        user_id: user.id,
      })
      .select()
      .single();

    if (processError || !process) throw processError;

    // Instantiate all stages, steps, fields from template
    const { data: stageTemplates } = await supabase
      .from("stage_templates")
      .select("*")
      .eq("model_id", "00000000-0000-0000-0000-000000000001")
      .order("order_index");

    if (stageTemplates) {
      for (const st of stageTemplates) {
        const { data: stageInst } = await supabase
          .from("stage_instances")
          .insert({ process_id: process.id, stage_template_id: st.id })
          .select()
          .single();

        if (!stageInst) continue;

        const { data: stepTemplates } = await supabase
          .from("step_templates")
          .select("*")
          .eq("stage_template_id", st.id)
          .order("order_index");

        if (!stepTemplates) continue;

        for (const stepT of stepTemplates) {
          const { data: stepInst } = await supabase
            .from("step_instances")
            .insert({
              stage_instance_id: stageInst.id,
              step_template_id: stepT.id,
            })
            .select()
            .single();

          if (!stepInst) continue;

          const { data: fieldTemplates } = await supabase
            .from("field_templates")
            .select("*")
            .eq("step_template_id", stepT.id)
            .order("order_index");

          if (fieldTemplates && fieldTemplates.length > 0) {
            const inserts = fieldTemplates.map((ft) => ({
              step_instance_id: stepInst.id,
              field_template_id: ft.id,
            }));
            const { data: createdFields } = await supabase
              .from("field_instances")
              .insert(inserts)
              .select();

            // Create task records for task-type fields
            if (createdFields) {
              const taskFieldTemplateIds = fieldTemplates
                .filter((ft) => ft.type === "task")
                .map((ft) => ft.id);

              const taskFieldInstances = createdFields.filter((fi) =>
                taskFieldTemplateIds.includes(fi.field_template_id)
              );

              if (taskFieldInstances.length > 0) {
                await supabase.from("tasks").insert(
                  taskFieldInstances.map((fi) => ({
                    field_instance_id: fi.id,
                  }))
                );
              }
            }
          }
        }
      }
    }

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
