"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Zap,
  Loader2,
  Check,
  Sparkles,
  StickyNote,
  FileCheck,
  FileX,
  Trash2,
  Plus,
  User,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { DependencyHint } from "./DependencyHint";
import type {
  Field,
  TaskListItem,
  TaskListItemStatus,
  TaskListItemType,
} from "@/types";

interface TaskListFieldCardProps {
  field: Field;
  processId: string;
  onUpdate: () => void;
}

const statusLabels: Record<TaskListItemStatus, string> = {
  not_started: "Nicht begonnen",
  planned: "Geplant",
  in_progress: "In Arbeit",
  done: "Erledigt",
  wont_do: "Wird nicht gemacht",
};

const statusShortLabels: Record<TaskListItemStatus, string> = {
  not_started: "Offen",
  planned: "Geplant",
  in_progress: "Arbeit",
  done: "Erledigt",
  wont_do: "Entfällt",
};

const statusBadgeClasses: Record<TaskListItemStatus, string> = {
  not_started: "bg-destructive/15 text-destructive border-destructive/30",
  planned: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  done: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  wont_do: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
};

const typeLabels: Record<TaskListItemType, string> = {
  self: "Selbst",
  delegated: "Delegiert",
};

function deriveDisplayStatus(
  items: TaskListItem[]
): "red" | "yellow" | "green" | "empty" {
  if (!items.length) return "empty";
  const hasOpen = items.some(
    (t) => t.status === "not_started" || t.status === "planned"
  );
  if (hasOpen) return "red";
  const hasInProgress = items.some((t) => t.status === "in_progress");
  if (hasInProgress) return "yellow";
  const allClosed = items.every(
    (t) => t.status === "done" || t.status === "wont_do"
  );
  return allClosed ? "green" : "yellow";
}

interface SortableTaskRowProps {
  item: TaskListItem;
  index: number;
  isClosed: boolean;
  updateItem: (
    id: string,
    updates: Partial<
      Pick<TaskListItem, "title" | "notes" | "type" | "status" | "result">
    >
  ) => Promise<void>;
  handleOptimizeResult: (item: TaskListItem) => Promise<void>;
  optimizingId: string | null;
  openStatusPopoverId: string | null;
  setOpenStatusPopoverId: (id: string | null) => void;
  openResultPopoverId: string | null;
  setOpenResultPopoverId: (id: string | null) => void;
  openTypePopoverId: string | null;
  setOpenTypePopoverId: (id: string | null) => void;
  handleDeleteItem: (id: string) => Promise<void>;
}

function SortableTaskRow({
  item,
  index,
  isClosed,
  updateItem,
  handleOptimizeResult,
  optimizingId,
  openStatusPopoverId,
  setOpenStatusPopoverId,
  openResultPopoverId,
  setOpenResultPopoverId,
  openTypePopoverId,
  setOpenTypePopoverId,
  handleDeleteItem,
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0",
        isDragging && "opacity-70 bg-card z-10"
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-end text-xs font-medium text-muted-foreground tabular-nums hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label={`Position ${index + 1}, zum Umsortieren ziehen`}
          >
            {index + 1}.
          </button>
        </TooltipTrigger>
        <TooltipContent>Zum Umsortieren ziehen</TooltipContent>
      </Tooltip>
      <Input
        value={item.title}
        onChange={(e) => updateItem(item.id, { title: e.target.value })}
        placeholder="Titel..."
        className="flex-1 min-w-0 h-8 text-xs"
        disabled={isClosed}
      />

      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 shrink-0",
                  item.notes?.trim()
                    ? "text-white hover:bg-white/20"
                    : "text-muted-foreground/60 hover:bg-muted-foreground/10"
                )}
                disabled={isClosed}
              >
                <StickyNote className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {item.notes?.trim() ? "Notizen bearbeiten" : "Notizen (leer)"}
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-80" align="end">
          <p className="text-xs font-medium mb-2">Notizen</p>
          <Textarea
            value={item.notes}
            onChange={(e) => updateItem(item.id, { notes: e.target.value })}
            placeholder="Notizen..."
            rows={3}
            className="text-xs resize-y"
            disabled={isClosed}
          />
        </PopoverContent>
      </Popover>

      <Popover
        open={openTypePopoverId === item.id}
        onOpenChange={(open) => setOpenTypePopoverId(open ? item.id : null)}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isClosed}
            className={cn(
              "flex h-8 min-w-[90px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 text-[10px] font-medium transition-colors",
              item.status === "done" || item.status === "wont_do"
                ? "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground"
                : item.type === "self"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
            )}
          >
            {item.type === "self" ? (
              <User className="h-3.5 w-3.5" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            {typeLabels[item.type]}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" align="start">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => {
                updateItem(item.id, { type: "self" });
                setOpenTypePopoverId(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded border px-2 py-1.5 text-left text-[10px] font-medium cursor-pointer touch-manipulation w-full transition-colors",
                item.type === "self"
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              {typeLabels.self}
            </button>
            <button
              type="button"
              onClick={() => {
                updateItem(item.id, { type: "delegated" });
                setOpenTypePopoverId(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded border px-2 py-1.5 text-left text-[10px] font-medium cursor-pointer touch-manipulation w-full transition-colors",
                item.type === "delegated"
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-500"
                  : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              <Share2 className="h-3.5 w-3.5 shrink-0" />
              {typeLabels.delegated}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover
        open={openResultPopoverId === item.id}
        onOpenChange={(open) => setOpenResultPopoverId(open ? item.id : null)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 shrink-0",
                  item.status === "done" || item.status === "wont_do"
                    ? "text-muted-foreground/70 hover:bg-muted-foreground/10"
                    : item.result?.trim()
                      ? "text-emerald-500 hover:bg-emerald-500/20"
                      : "text-destructive/70 hover:bg-destructive/10"
                )}
                disabled={isClosed}
              >
                {item.result?.trim() ? (
                  <FileCheck className="h-3.5 w-3.5" />
                ) : (
                  <FileX className="h-3.5 w-3.5" />
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {item.result?.trim()
              ? "Ergebnis bearbeiten"
              : "Ergebnis (leer)"}
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-96" align="end">
          <p className="text-xs font-medium mb-2">Ergebnis</p>
          <Textarea
            value={item.result ?? ""}
            onChange={(e) =>
              updateItem(item.id, { result: e.target.value })
            }
            placeholder="Ergebnis..."
            rows={3}
            className="text-xs resize-y mb-2"
            disabled={isClosed}
          />
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            {!isClosed && item.result?.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-blue-400 border-blue-400/30 hover:bg-blue-400/20"
                onClick={() => handleOptimizeResult(item)}
                disabled={optimizingId === item.id}
              >
                {optimizingId === item.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Text sauber abrunden
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenResultPopoverId(null)}
            >
              OK
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover
        open={openStatusPopoverId === item.id}
        onOpenChange={(open) => setOpenStatusPopoverId(open ? item.id : null)}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isClosed}
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10px] font-medium cursor-pointer touch-manipulation shrink-0",
              statusBadgeClasses[item.status]
            )}
          >
            {statusShortLabels[item.status]}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" align="start">
          <div className="flex flex-col gap-0.5">
            {(Object.keys(statusBadgeClasses) as TaskListItemStatus[]).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    updateItem(item.id, { status: s });
                    setOpenStatusPopoverId(null);
                  }}
                  className={cn(
                    "rounded border px-2 py-1 text-left text-[10px] font-medium cursor-pointer touch-manipulation w-full",
                    statusBadgeClasses[s]
                  )}
                >
                  {statusShortLabels[s]}
                </button>
              )
            )}
          </div>
        </PopoverContent>
      </Popover>

      {!isClosed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDeleteItem(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Task löschen</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function TaskListFieldCard({
  field,
  processId,
  onUpdate,
}: TaskListFieldCardProps) {
  const dependencies: string[] = field.dependencies ?? [];
  const isClosed = field.status === "closed";
  const isSkipped = field.status === "skipped";

  const [items, setItems] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [openStatusPopoverId, setOpenStatusPopoverId] = useState<string | null>(null);
  const [openResultPopoverId, setOpenResultPopoverId] = useState<string | null>(null);
  const [openTypePopoverId, setOpenTypePopoverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const loadItems = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("task_list_items")
      .select("*")
      .eq("field_id", field.id)
      .order("order_index");
    setItems((data as TaskListItem[]) ?? []);
    setLoading(false);
  }, [field.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const updateItem = async (
    id: string,
    updates: Partial<Pick<TaskListItem, "title" | "notes" | "type" | "status" | "result">>
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
    const supabase = createClient();
    await supabase.from("task_list_items").update(updates).eq("id", id);
    onUpdate();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: field.id,
          process_id: processId,
        }),
      });
      if (!res.ok) throw new Error("Generation fehlgeschlagen");
      await loadItems();
      onUpdate();
    } finally {
      setGenerating(false);
    }
  };

  const handleOptimizeResult = async (item: TaskListItem) => {
    if (!item.result?.trim()) return;
    setOptimizingId(item.id);
    try {
      const res = await fetch("/api/ai/optimize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.result }),
      });
      if (!res.ok) throw new Error("Optimierung fehlgeschlagen");
      const { text } = await res.json();
      await updateItem(item.id, { result: text });
    } finally {
      setOptimizingId(null);
    }
  };

  const handleCloseField = async () => {
    const supabase = createClient();
    await supabase.from("fields").update({ status: "closed" }).eq("id", field.id);
    onUpdate();
  };

  const handleAddItem = async () => {
    const supabase = createClient();
    await supabase.from("task_list_items").insert({
      field_id: field.id,
      order_index: items.length,
      title: "Neuer Task",
      notes: "",
      type: "self",
      status: "not_started",
    });
    await loadItems();
    onUpdate();
  };

  const handleDeleteItem = async (id: string) => {
    const supabase = createClient();
    await supabase.from("task_list_items").delete().eq("id", id);
    await loadItems();
    onUpdate();
  };

  const handleReorder = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      const supabase = createClient();
      for (let i = 0; i < reordered.length; i++) {
        await supabase
          .from("task_list_items")
          .update({ order_index: i })
          .eq("id", reordered[i].id);
      }
      onUpdate();
    },
    [items, onUpdate]
  );

  const displayStatus = deriveDisplayStatus(items);
  const allClosed =
    items.length > 0 &&
    items.every((t) => t.status === "done" || t.status === "wont_do");

  if (loading) {
    return (
      <div className="field-card field-card-open animate-pulse">
        <div className="h-4 bg-secondary rounded w-1/3 mb-4" />
        <div className="h-20 bg-secondary rounded" />
      </div>
    );
  }

  const statusDotClass = {
    red: "bg-destructive/70",
    yellow: "bg-status-warning",
    green: "bg-emerald-500",
    empty: "bg-muted-foreground/50",
  }[displayStatus];

  return (
    <div
      className={cn(
        "field-card",
        isSkipped
          ? "field-card-skipped"
          : isClosed
            ? "field-card-closed"
            : "field-card-open",
        "bg-card/80"
      )}
    >
      <div
        className={cn(
          "-mx-4 -mt-4 mb-3 px-4 py-2.5 rounded-t-lg space-y-1.5",
          isSkipped
            ? "bg-muted/30"
            : isClosed
              ? "bg-emerald-500/8"
              : displayStatus === "red"
                ? "bg-destructive/8"
                : displayStatus === "yellow"
                  ? "bg-status-warning/8"
                  : "bg-emerald-500/8"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                isSkipped ? "bg-muted-foreground/50" : statusDotClass
              )}
            />
            <h4 className="text-sm font-medium">{field.name ?? "Task Liste"}</h4>
            {!isSkipped && (
              <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-400">
                Task Liste
              </span>
            )}
            {!isClosed && field.ai_prompt && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-400 hover:bg-blue-400! hover:text-black!"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Taskliste generieren</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {dependencies.length > 0 && (
        <DependencyHint dependencyIds={dependencies} processId={processId} />
      )}

      <div className="pt-2 space-y-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleReorder}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item, index) => (
              <SortableTaskRow
                key={item.id}
                item={item}
                index={index}
                isClosed={isClosed}
                updateItem={updateItem}
                handleOptimizeResult={handleOptimizeResult}
                optimizingId={optimizingId}
                openStatusPopoverId={openStatusPopoverId}
                setOpenStatusPopoverId={setOpenStatusPopoverId}
                openResultPopoverId={openResultPopoverId}
                setOpenResultPopoverId={setOpenResultPopoverId}
                openTypePopoverId={openTypePopoverId}
                setOpenTypePopoverId={setOpenTypePopoverId}
                handleDeleteItem={handleDeleteItem}
              />
            ))}
          </SortableContext>
        </DndContext>

        {!isClosed && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleAddItem}
          >
            <Plus className="h-3.5 w-3.5" />
            Task hinzufügen
          </Button>
        )}

        {!isClosed && allClosed && items.length > 0 && (
          <div className="flex gap-2 pt-2 mt-2 border-t border-border/30">
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleCloseField}
            >
              <Check className="h-3.5 w-3.5" />
              Feld abschließen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
