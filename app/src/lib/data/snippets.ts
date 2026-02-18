import { createClient } from "@/lib/supabase/client";
import type { Snippet, SnippetFolder, SnippetFolderNode, SnippetTree } from "@/types";

const supabase = createClient();

export const ROOT_SNIPPET_FOLDER = "__root__";

function sortByOrder<T extends { order_index: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order_index - b.order_index);
}

function buildFolderTree(
  foldersByParent: Map<string | null, SnippetFolder[]>,
  parentId: string | null = null
): SnippetFolderNode[] {
  const current = sortByOrder(foldersByParent.get(parentId) ?? []);
  return current.map((folder) => ({
    ...folder,
    children: buildFolderTree(foldersByParent, folder.id),
  }));
}

export async function getSnippetTree(): Promise<SnippetTree> {
  const { data: folders, error: foldersError } = await supabase
    .from("snippet_folders")
    .select("*")
    .order("order_index", { ascending: true });

  if (foldersError) throw foldersError;

  const { data: snippets, error: snippetsError } = await supabase
    .from("snippets")
    .select("*")
    .order("order_index", { ascending: true });

  if (snippetsError) throw snippetsError;

  const foldersByParent = new Map<string | null, SnippetFolder[]>();
  for (const folder of (folders ?? []) as SnippetFolder[]) {
    const list = foldersByParent.get(folder.parent_id) ?? [];
    list.push(folder);
    foldersByParent.set(folder.parent_id, list);
  }

  const snippetsByFolder: Record<string, Snippet[]> = {};
  for (const snippet of (snippets ?? []) as Snippet[]) {
    const key = snippet.folder_id ?? ROOT_SNIPPET_FOLDER;
    if (!snippetsByFolder[key]) snippetsByFolder[key] = [];
    snippetsByFolder[key].push(snippet);
  }

  for (const key of Object.keys(snippetsByFolder)) {
    snippetsByFolder[key] = sortByOrder(snippetsByFolder[key]);
  }

  return {
    folders: buildFolderTree(foldersByParent, null),
    snippetsByFolder,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getNextFolderIndex(parentId: string | null): Promise<number> {
  const query = supabase
    .from("snippet_folders")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1);

  const { data, error } = parentId
    ? await query.eq("parent_id", parentId)
    : await query.is("parent_id", null);

  if (error) throw error;
  return ((data?.[0]?.order_index as number | undefined) ?? -1) + 1;
}

async function getNextSnippetIndex(folderId: string | null): Promise<number> {
  const query = supabase
    .from("snippets")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1);

  const { data, error } = folderId
    ? await query.eq("folder_id", folderId)
    : await query.is("folder_id", null);

  if (error) throw error;
  return ((data?.[0]?.order_index as number | undefined) ?? -1) + 1;
}

export async function createSnippetFolder(input: {
  name: string;
  description?: string | null;
  parentId?: string | null;
}): Promise<SnippetFolder> {
  const parentId = input.parentId ?? null;
  const nextIndex = await getNextFolderIndex(parentId);
  const createdBy = await getCurrentUserId();

  const { data, error } = await supabase
    .from("snippet_folders")
    .insert({
      parent_id: parentId,
      name: input.name,
      description: input.description ?? null,
      order_index: nextIndex,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as SnippetFolder;
}

export async function updateSnippetFolder(
  id: string,
  patch: Partial<Pick<SnippetFolder, "name" | "description" | "parent_id">>
): Promise<SnippetFolder> {
  const { data, error } = await supabase
    .from("snippet_folders")
    .update({
      name: patch.name,
      description: patch.description,
      parent_id: patch.parent_id,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as SnippetFolder;
}

export async function deleteSnippetFolder(id: string, force = false): Promise<void> {
  if (!force) {
    const { data: childFolders, error: childError } = await supabase
      .from("snippet_folders")
      .select("id")
      .eq("parent_id", id)
      .limit(1);
    if (childError) throw childError;

    const { data: childSnippets, error: snippetError } = await supabase
      .from("snippets")
      .select("id")
      .eq("folder_id", id)
      .limit(1);
    if (snippetError) throw snippetError;

    if ((childFolders?.length ?? 0) > 0 || (childSnippets?.length ?? 0) > 0) {
      throw new Error("Folder is not empty");
    }
  }

  const { error } = await supabase.from("snippet_folders").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderSnippetFolders(
  parentId: string | null,
  orderedFolderIds: string[]
): Promise<void> {
  const updates = orderedFolderIds.map((id, index) =>
    supabase
      .from("snippet_folders")
      .update({ order_index: index, parent_id: parentId })
      .eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function createSnippet(input: {
  folderId?: string | null;
  name: string;
  shortDescription?: string | null;
  content?: string;
}): Promise<Snippet> {
  const folderId = input.folderId ?? null;
  const nextIndex = await getNextSnippetIndex(folderId);
  const createdBy = await getCurrentUserId();

  const { data, error } = await supabase
    .from("snippets")
    .insert({
      folder_id: folderId,
      name: input.name,
      short_description: input.shortDescription ?? null,
      content: input.content ?? "",
      order_index: nextIndex,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Snippet;
}

export async function updateSnippet(
  id: string,
  patch: Partial<Pick<Snippet, "name" | "short_description" | "content" | "folder_id">>
): Promise<Snippet> {
  const { data, error } = await supabase
    .from("snippets")
    .update({
      name: patch.name,
      short_description: patch.short_description,
      content: patch.content,
      folder_id: patch.folder_id,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Snippet;
}

export async function deleteSnippet(id: string): Promise<void> {
  const { error } = await supabase.from("snippets").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderSnippets(
  folderId: string | null,
  orderedSnippetIds: string[]
): Promise<void> {
  const updates = orderedSnippetIds.map((id, index) =>
    supabase
      .from("snippets")
      .update({ order_index: index, folder_id: folderId })
      .eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
