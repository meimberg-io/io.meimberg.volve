"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Snippet } from "@/types";

interface SnippetListProps {
  snippets: Snippet[];
  selectedSnippetId: string | null;
  onSelect: (snippetId: string) => void;
  onCreate: () => void;
  onEdit: (snippetId: string) => void;
  onDelete: (snippetId: string) => void;
  onReorder: (orderedSnippetIds: string[]) => void;
}

function SortableSnippetItem({
  snippet,
  selectedSnippetId,
  onSelect,
  onEdit,
  onDelete,
}: {
  snippet: Snippet;
  selectedSnippetId: string | null;
  onSelect: (snippetId: string) => void;
  onEdit: (snippetId: string) => void;
  onDelete: (snippetId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: snippet.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-md border border-border/50 p-2",
        selectedSnippetId === snippet.id ? "border-primary/40 bg-primary/10" : "hover:bg-secondary/40",
        isDragging && "opacity-70 shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground active:cursor-grabbing"
          title="Per Drag & Drop sortieren"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onSelect(snippet.id)}
          className="w-full cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">{snippet.name}</span>
          </div>
          {snippet.short_description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {snippet.short_description}
            </p>
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-end gap-0.5">
        <Button variant="ghost" size="icon-xs" onClick={() => onEdit(snippet.id)} title="Bearbeiten">
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={() => onDelete(snippet.id)} title="Löschen">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function SnippetList({
  snippets,
  selectedSnippetId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onReorder,
}: SnippetListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = snippets.map((s) => s.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Snippets</h2>
        <Button variant="outline" size="xs" className="gap-1" onClick={onCreate}>
          <Plus className="h-3 w-3" />
          Neu
        </Button>
      </div>

      {snippets.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          In diesem Ordner gibt es noch keine Snippets.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {snippets.map((snippet) => (
                <SortableSnippetItem
                  key={snippet.id}
                  snippet={snippet}
                  selectedSnippetId={selectedSnippetId}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
