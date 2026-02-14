import { createClient } from "@/lib/supabase/client";
import type { SeedDocument } from "@/types";

const supabase = createClient();

export async function getSeedDocuments(
  processId: string
): Promise<SeedDocument[]> {
  const { data, error } = await supabase
    .from("seed_documents")
    .select("*")
    .eq("process_id", processId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function uploadSeedDocument(
  processId: string,
  file: File
): Promise<SeedDocument> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const storagePath = `${user.id}/${processId}/${Date.now()}_${file.name}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("seeds")
    .upload(storagePath, file);

  if (uploadError) throw uploadError;

  // Get current max order_index
  const { data: existing } = await supabase
    .from("seed_documents")
    .select("order_index")
    .eq("process_id", processId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  // Create record
  const { data, error } = await supabase
    .from("seed_documents")
    .insert({
      process_id: processId,
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSeedDocument(
  documentId: string,
  storagePath: string
): Promise<void> {
  // Delete from storage
  await supabase.storage.from("seeds").remove([storagePath]);

  // Delete record
  const { error } = await supabase
    .from("seed_documents")
    .delete()
    .eq("id", documentId);

  if (error) throw error;
}

export async function reorderSeedDocuments(
  documents: { id: string; order_index: number }[]
): Promise<void> {
  for (const doc of documents) {
    await supabase
      .from("seed_documents")
      .update({ order_index: doc.order_index })
      .eq("id", doc.id);
  }
}

export async function getSeedDocumentContent(
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("seeds")
    .download(storagePath);

  if (error) throw error;
  return await data.text();
}
