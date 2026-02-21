"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { ProjectCard } from "@/components/project/ProjectCard";
import { NewProjectDialog } from "@/components/project/NewProjectDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { createProject } from "@/lib/data/projects";
import type { Process } from "@/types";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("processes")
      .select("*")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    setProjects((data as Process[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects(); // eslint-disable-line react-hooks/set-state-in-effect -- async data fetch
  }, [loadProjects]);

  const handleCreateProject = async (name: string, modelId: string) => {
    const project = await createProject(name, modelId);
    router.push(`/project/${project.id}/seed`);
  };

  const handleArchive = async (id: string) => {
    const supabase = createClient();
    await supabase.from("processes").update({ status: "archived" }).eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Projekte</h1>
        <p className="text-muted-foreground">
          Deine Projekte im Überblick
        </p>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewProjectDialog onSubmit={handleCreateProject} />

          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onArchive={handleArchive}
            />
          ))}

          {projects.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center sm:col-start-2">
              <Lightbulb className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-1 text-lg font-medium">Noch keine Projekte?</h3>
              <p className="text-sm text-muted-foreground">
                Starte dein erstes Projekt und bringe deine Geschäftsidee auf den Weg.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
