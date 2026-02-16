import { createClient } from "@/lib/supabase/client";
import type { FieldInstance, FieldVersion } from "@/types";

const supabase = createClient();

export async function updateFieldContent(
  fieldInstanceId: string,
  content: string,
  source: string = "manual"
): Promise<void> {
  // Update field content and status
  const newStatus = content.trim() ? "open" : "empty";

  const { error: updateError } = await supabase
    .from("field_instances")
    .update({ content, status: newStatus })
    .eq("id", fieldInstanceId);

  if (updateError) throw updateError;

  // Create version entry
  if (content.trim()) {
    const { error: versionError } = await supabase
      .from("field_versions")
      .insert({
        field_instance_id: fieldInstanceId,
        content,
        source,
      });

    if (versionError) throw versionError;
  }
}

export async function closeField(fieldInstanceId: string): Promise<void> {
  const { error } = await supabase
    .from("field_instances")
    .update({ status: "closed" })
    .eq("id", fieldInstanceId);

  if (error) throw error;
}

export async function reopenField(fieldInstanceId: string): Promise<void> {
  const { error } = await supabase
    .from("field_instances")
    .update({ status: "open" })
    .eq("id", fieldInstanceId);

  if (error) throw error;
}

export async function getFieldVersions(
  fieldInstanceId: string
): Promise<FieldVersion[]> {
  const { data, error } = await supabase
    .from("field_versions")
    .select("*")
    .eq("field_instance_id", fieldInstanceId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function restoreFieldVersion(
  fieldInstanceId: string,
  versionId: string
): Promise<void> {
  // Get the version content
  const { data: version, error: versionError } = await supabase
    .from("field_versions")
    .select("content")
    .eq("id", versionId)
    .single();

  if (versionError || !version) throw versionError ?? new Error("Version nicht gefunden");

  // Update field with version content
  await updateFieldContent(fieldInstanceId, version.content, "manual");
}

export async function getFieldInstance(
  fieldInstanceId: string
): Promise<FieldInstance | null> {
  const { data, error } = await supabase
    .from("field_instances")
    .select("*")
    .eq("id", fieldInstanceId)
    .single();

  if (error) return null;
  return data;
}

export async function getDependencyContents(
  dependencyTemplateIds: string[],
  processId: string
): Promise<Record<string, { name: string; content: string }>> {
  if (!dependencyTemplateIds.length) return {};

  // Get field instances that match these templates within this process
  const { data: fieldInstances, error } = await supabase
    .from("field_instances")
    .select(`
      id,
      content,
      name,
      field_template_id,
      step_instance:step_instances(
        stage_instance:stage_instances(process_id)
      )
    `)
    .in("field_template_id", dependencyTemplateIds);

  if (error) throw error;

  const result: Record<string, { name: string; content: string }> = {};

  for (const fi of fieldInstances ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stageInstance = (fi as any).step_instance?.stage_instance;
    if (stageInstance?.process_id === processId && fi.content) {
      result[fi.field_template_id] = {
        name: fi.name ?? "Unbekannt",
        content: fi.content,
      };
    }
  }

  return result;
}
