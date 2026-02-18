import { createClient } from "@/lib/supabase/client";
import { copyProcess } from "./templates";
import type { Process, ProcessWithStages, Stage } from "@/types";

const supabase = createClient();

export async function getProcesses(): Promise<Process[]> {
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .eq("is_template", false)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getArchivedProcesses(): Promise<Process[]> {
  const { data, error } = await supabase
    .from("processes")
    .select("*")
    .eq("is_template", false)
    .eq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProcessWithStages(
  processId: string
): Promise<ProcessWithStages | null> {
  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("*")
    .eq("id", processId)
    .single();

  if (processError) throw processError;
  if (!process) return null;

  const { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select("*")
    .eq("process_id", processId)
    .order("order_index", { ascending: true });

  if (stagesError) throw stagesError;

  return {
    ...process,
    stages: (stages ?? []) as Stage[],
  };
}

export async function createProcess(
  name: string,
  templateId: string = "00000000-0000-0000-0000-000000000001"
): Promise<Process> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  return copyProcess(templateId, {
    is_template: false,
    name,
    userId: user.id,
  });
}

export async function updateProcessStatus(
  processId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("processes")
    .update({ status })
    .eq("id", processId);

  if (error) throw error;
}

export async function updateProcessName(
  processId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from("processes")
    .update({ name })
    .eq("id", processId);

  if (error) throw error;
}

export async function archiveProcess(processId: string): Promise<void> {
  await updateProcessStatus(processId, "archived");
}

export async function unarchiveProcess(processId: string): Promise<void> {
  await updateProcessStatus(processId, "active");
}
