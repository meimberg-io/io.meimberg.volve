import { createClient } from "@/lib/supabase/client";
import type { Field, FieldVersion } from "@/types";

const supabase = createClient();

export async function updateFieldContent(
  fieldId: string,
  content: string,
  source: string = "manual"
): Promise<void> {
  const newStatus = content.trim() ? "open" : "empty";

  const { error: updateError } = await supabase
    .from("fields")
    .update({ content, status: newStatus })
    .eq("id", fieldId);

  if (updateError) throw updateError;

  if (content.trim()) {
    const { error: versionError } = await supabase
      .from("field_versions")
      .insert({
        field_id: fieldId,
        content,
        source,
      });

    if (versionError) throw versionError;
  }
}

export async function closeField(fieldId: string): Promise<void> {
  const { error } = await supabase
    .from("fields")
    .update({ status: "closed" })
    .eq("id", fieldId);

  if (error) throw error;
}

export async function reopenField(fieldId: string): Promise<void> {
  const { error } = await supabase
    .from("fields")
    .update({ status: "open" })
    .eq("id", fieldId);

  if (error) throw error;
}

export async function getFieldVersions(
  fieldId: string
): Promise<FieldVersion[]> {
  const { data, error } = await supabase
    .from("field_versions")
    .select("*")
    .eq("field_id", fieldId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function restoreFieldVersion(
  fieldId: string,
  versionId: string
): Promise<void> {
  const { data: version, error: versionError } = await supabase
    .from("field_versions")
    .select("content")
    .eq("id", versionId)
    .single();

  if (versionError || !version)
    throw versionError ?? new Error("Version nicht gefunden");

  await updateFieldContent(fieldId, version.content, "manual");
}

export async function getField(fieldId: string): Promise<Field | null> {
  const { data, error } = await supabase
    .from("fields")
    .select("*")
    .eq("id", fieldId)
    .single();

  if (error) return null;
  return data;
}

export async function getDependencyContents(
  dependencyIds: string[],
  processId: string
): Promise<Record<string, { name: string; content: string }>> {
  if (!dependencyIds.length) return {};

  const { data: fields, error } = await supabase
    .from("fields")
    .select(`
      id,
      content,
      name,
      step:steps(
        stage:stages(process_id)
      )
    `)
    .in("id", dependencyIds);

  if (error) throw error;

  const result: Record<string, { name: string; content: string }> = {};

  for (const f of fields ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stage = (f as any).step?.stage;
    if (stage?.process_id === processId && f.content) {
      result[f.id] = {
        name: f.name ?? "Unbekannt",
        content: f.content,
      };
    }
  }

  return result;
}
