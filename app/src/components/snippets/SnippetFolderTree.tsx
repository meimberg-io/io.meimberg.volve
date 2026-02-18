"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, Folder, FolderPlus, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SnippetFolderNode } from "@/types";

interface SnippetFolderTreeProps {
  folders: SnippetFolderNode[];
  selectedFolderId: string | null;
  onSelect: (folderId: string) => void;
  onCreateRoot: () => void;
  onCreateChild: (parentId: string) => void;
  onEdit: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onReorder: (parentId: string | null, orderedFolderIds: string[]) => void;
}

function SortableFolderNode({
  node,
  level,
  selectedFolderId,
  onSelect,
  onCreateChild,
  onEdit,
  onDelete,
  onReorder,
}: {
  node: SnippetFolderNode;
  level: number;
  selectedFolderId: string | null;
  onSelect: (folderId: string) => void;
  onCreateChild: (parentId: string) => void;
  onEdit: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onReorder: (parentId: string | null, orderedFolderIds: string[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  });
  const [open, setOpen] = useState(true);
  const isActive = node.id === selectedFolderId;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const childIds = useMemo(() => node.children.map((c) => c.id), [node.children]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleChildDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = childIds.indexOf(String(active.id));
    const newIndex = childIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(node.id, arrayMove(childIds, oldIndex, newIndex));
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("space-y-1", isDragging && "opacity-70")}>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm",
          isActive ? "bg-primary/15 text-primary" : "hover:bg-secondary/60",
          isDragging && "shadow-lg"
        )}
        style={{ paddingLeft: `${8 + level * 12}px` }}
      >
        <button
          type="button"
          className="cursor-grab rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground active:cursor-grabbing"
          title="Per Drag & Drop sortieren"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded p-0.5 hover:bg-secondary cursor-pointer"
          onClick={() => setOpen((v) => !v)}
          title={open ? "Einklappen" : "Ausklappen"}
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
          onClick={() => onSelect(node.id)}
        >
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>

        <div className="flex w-[76px] shrink-0 items-center justify-end gap-0.5 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onCreateChild(node.id)}
            title="Unterordner"
          >
            <FolderPlus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => onEdit(node.id)} title="Bearbeiten">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => onDelete(node.id)} title="Löschen">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {open && node.children.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChildDragEnd}>
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {node.children.map((child) => (
                <SortableFolderNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  selectedFolderId={selectedFolderId}
                  onSelect={onSelect}
                  onCreateChild={onCreateChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReorder={onReorder}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export function SnippetFolderTree({
  folders,
  selectedFolderId,
  onSelect,
  onCreateRoot,
  onCreateChild,
  onEdit,
  onDelete,
  onReorder,
}: SnippetFolderTreeProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const rootIds = useMemo(() => folders.map((f) => f.id), [folders]);

  const handleRootDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rootIds.indexOf(String(active.id));
    const newIndex = rootIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(null, arrayMove(rootIds, oldIndex, newIndex));
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Ordner</h2>
        <Button variant="outline" size="xs" onClick={onCreateRoot} className="gap-1">
          <FolderPlus className="h-3 w-3" />
          Neu
        </Button>
      </div>

      {folders.length === 0 ? (
        <p className="text-xs text-muted-foreground">Noch keine Ordner vorhanden.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRootDragEnd}>
          <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {folders.map((folder) => (
                <SortableFolderNode
                  key={folder.id}
                  node={folder}
                  level={0}
                  selectedFolderId={selectedFolderId}
                  onSelect={onSelect}
                  onCreateChild={onCreateChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReorder={onReorder}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
