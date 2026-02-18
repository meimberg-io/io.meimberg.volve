"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderDialog } from "@/components/snippets/FolderDialog";
import { SnippetDialog } from "@/components/snippets/SnippetDialog";
import { SnippetFolderTree } from "@/components/snippets/SnippetFolderTree";
import { SnippetList } from "@/components/snippets/SnippetList";
import { SnippetEditor } from "@/components/snippets/SnippetEditor";
import {
  createSnippet,
  createSnippetFolder,
  deleteSnippet,
  deleteSnippetFolder,
  getSnippetTree,
  reorderSnippetFolders,
  reorderSnippets,
  updateSnippet,
  updateSnippetFolder,
} from "@/lib/data/snippets";
import type { SnippetFolderNode } from "@/types";

function flattenFolders(nodes: SnippetFolderNode[]): SnippetFolderNode[] {
  const out: SnippetFolderNode[] = [];
  for (const node of nodes) {
    out.push(node);
    out.push(...flattenFolders(node.children));
  }
  return out;
}

export default function SnippetsPage() {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null);

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<"create-root" | "create-child" | "edit">("create-root");
  const [folderDialogFolderId, setFolderDialogFolderId] = useState<string | null>(null);

  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [snippetDialogMode, setSnippetDialogMode] = useState<"create" | "edit">("create");

  const { data: tree, isLoading } = useQuery({
    queryKey: ["snippets", "tree"],
    queryFn: getSnippetTree,
  });

  const folders = useMemo(() => tree?.folders ?? [], [tree?.folders]);
  const snippetsByFolder = useMemo(() => tree?.snippetsByFolder ?? {}, [tree?.snippetsByFolder]);

  const flatFolders = useMemo(() => flattenFolders(folders), [folders]);
  const activeFolderId =
    selectedFolderId && flatFolders.some((f) => f.id === selectedFolderId)
      ? selectedFolderId
      : (folders[0]?.id ?? null);

  const snippets = useMemo(() => {
    if (!activeFolderId) return [];
    return snippetsByFolder[activeFolderId] ?? [];
  }, [activeFolderId, snippetsByFolder]);

  const activeSnippetId =
    selectedSnippetId && snippets.some((s) => s.id === selectedSnippetId)
      ? selectedSnippetId
      : null;
  const selectedSnippet = useMemo(
    () => snippets.find((s) => s.id === activeSnippetId) ?? null,
    [snippets, activeSnippetId]
  );

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["snippets", "tree"] });
  };

  const openCreateRootFolder = () => {
    setFolderDialogMode("create-root");
    setFolderDialogFolderId(null);
    setFolderDialogOpen(true);
  };

  const openCreateChildFolder = (parentId: string) => {
    setFolderDialogMode("create-child");
    setFolderDialogFolderId(parentId);
    setFolderDialogOpen(true);
  };

  const openEditFolder = (folderId: string) => {
    setFolderDialogMode("edit");
    setFolderDialogFolderId(folderId);
    setFolderDialogOpen(true);
  };

  const openCreateSnippet = () => {
    if (!activeFolderId) return;
    setSnippetDialogMode("create");
    setSnippetDialogOpen(true);
  };

  const openEditSnippet = (snippetId: string) => {
    setSelectedSnippetId(snippetId);
    setSnippetDialogMode("edit");
    setSnippetDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Snippets</h1>
        <p className="text-sm text-muted-foreground">
          Wiederverwendbare Markdown-Fragmente in verschachtelten Ordnern.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_320px_1fr]">
          <Skeleton className="h-[540px] rounded-xl" />
          <Skeleton className="h-[540px] rounded-xl" />
          <Skeleton className="h-[540px] rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_320px_1fr]">
          <SnippetFolderTree
            folders={folders}
            selectedFolderId={activeFolderId}
            onSelect={setSelectedFolderId}
            onCreateRoot={openCreateRootFolder}
            onCreateChild={openCreateChildFolder}
            onEdit={openEditFolder}
            onDelete={async (folderId) => {
              if (!confirm("Ordner wirklich löschen?")) return;
              try {
                await deleteSnippetFolder(folderId, false);
              } catch {
                if (
                  confirm(
                    "Ordner ist nicht leer. Soll er inkl. Unterordner und Snippets gelöscht werden?"
                  )
                ) {
                  await deleteSnippetFolder(folderId, true);
                } else {
                  return;
                }
              }
              if (selectedFolderId === folderId) {
                setSelectedFolderId(null);
                setSelectedSnippetId(null);
              }
              await refresh();
            }}
            onReorder={async (parentId, orderedFolderIds) => {
              await reorderSnippetFolders(parentId, orderedFolderIds);
              await refresh();
            }}
          />

          <SnippetList
            snippets={snippets}
            selectedSnippetId={activeSnippetId}
            onSelect={setSelectedSnippetId}
            onCreate={openCreateSnippet}
            onEdit={openEditSnippet}
            onDelete={async (snippetId) => {
              if (!confirm("Snippet wirklich löschen?")) return;
              await deleteSnippet(snippetId);
              if (selectedSnippetId === snippetId) setSelectedSnippetId(null);
              await refresh();
            }}
            onReorder={async (orderedSnippetIds) => {
              await reorderSnippets(activeFolderId, orderedSnippetIds);
              await refresh();
            }}
          />

          <SnippetEditor
            snippet={selectedSnippet}
            onSave={async ({ name, shortDescription, content }) => {
              if (!selectedSnippet) return;
              await updateSnippet(selectedSnippet.id, {
                name,
                short_description: shortDescription || null,
                content,
              });
              await refresh();
            }}
          />
        </div>
      )}

      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        title={
          folderDialogMode === "edit"
            ? "Ordner bearbeiten"
            : folderDialogMode === "create-child"
              ? "Unterordner erstellen"
              : "Ordner erstellen"
        }
        initialName={
          folderDialogMode === "edit"
            ? (flatFolders.find((f) => f.id === folderDialogFolderId)?.name ?? "")
            : ""
        }
        initialDescription={
          folderDialogMode === "edit"
            ? (flatFolders.find((f) => f.id === folderDialogFolderId)?.description ?? "")
            : ""
        }
        onSubmit={async ({ name, description }) => {
          if (folderDialogMode === "edit" && folderDialogFolderId) {
            await updateSnippetFolder(folderDialogFolderId, {
              name,
              description: description || null,
            });
          } else {
            const created = await createSnippetFolder({
              name,
              description: description || null,
              parentId: folderDialogMode === "create-child" ? folderDialogFolderId : null,
            });
            setSelectedFolderId(created.id);
          }
          await refresh();
        }}
      />

      <SnippetDialog
        open={snippetDialogOpen}
        onOpenChange={setSnippetDialogOpen}
        title={snippetDialogMode === "edit" ? "Snippet bearbeiten" : "Snippet erstellen"}
        initialName={snippetDialogMode === "edit" ? (selectedSnippet?.name ?? "") : ""}
        initialShortDescription={
          snippetDialogMode === "edit" ? (selectedSnippet?.short_description ?? "") : ""
        }
        initialContent={snippetDialogMode === "edit" ? (selectedSnippet?.content ?? "") : ""}
        onSubmit={async ({ name, shortDescription, content }) => {
          if (snippetDialogMode === "edit" && selectedSnippet) {
            await updateSnippet(selectedSnippet.id, {
              name,
              short_description: shortDescription || null,
              content,
            });
          } else {
            const created = await createSnippet({
              folderId: activeFolderId ?? null,
              name,
              shortDescription: shortDescription || null,
              content,
            });
            setSelectedSnippetId(created.id);
          }
          await refresh();
        }}
      />

      {!isLoading && folders.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <h3 className="text-sm font-medium">Noch keine Ordner</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Lege den ersten Snippet-Ordner an, um Inhalte zu organisieren.
          </p>
        </div>
      )}
    </div>
  );
}
