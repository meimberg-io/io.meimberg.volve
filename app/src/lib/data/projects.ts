import { createClient } from "@/lib/supabase/client";
import { copyProcess } from "./processes";
import type { Process, ProcessWithStages, Stage } from "@/types";

const supabase = createClient();

export async function getProjects(): Promise<Process[]> {
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .eq("is_process", false)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getArchivedProjects(): Promise<Process[]> {
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .eq("is_process", false)
    .eq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProjectWithStages(
  projectId: string
): Promise<ProcessWithStages | null> {
  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("*")
    .eq("id", projectId)
    .single();

  if (processError) throw processError;
  if (!process) return null;

  const { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select("*")
    .eq("process_id", projectId)
    .order("order_index", { ascending: true });

  if (stagesError) throw stagesError;

  return {
    ...process,
    stages: (stages ?? []) as Stage[],
  };
}

export async function createProject(
  name: string,
  templateId: string = "00000000-0000-0000-0000-000000000001"
): Promise<Process> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  return copyProcess(templateId, {
    is_process: false,
    name,
    userId: user.id,
  });
}

export async function updateProjectStatus(
  projectId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("processes")
    .update({ status })
    .eq("id", projectId);

  if (error) throw error;
}

export async function updateProjectName(
  projectId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from("processes")
    .update({ name })
    .eq("id", projectId);

  if (error) throw error;
}

export async function archiveProject(projectId: string): Promise<void> {
  await updateProjectStatus(projectId, "archived");
}

export async function unarchiveProject(projectId: string): Promise<void> {
  await updateProjectStatus(projectId, "active");
}
