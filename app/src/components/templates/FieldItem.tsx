"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Field, Stage, Step, FieldType } from "@/types";

const fieldTypeColors: Record<FieldType, string> = {
  text: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  long_text: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  file: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  file_list: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  task: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

interface FieldItemProps {
  field: Field;
  onSelect: (
    type: "stage" | "step" | "field",
    item: Stage | Step | Field
  ) => void;
  isSelected: boolean;
}

export function FieldItem({ field, onSelect, isSelected }: FieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: { type: "field", stepId: field.step_id },
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
        "flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-muted/50",
        isDragging && "opacity-50",
        isSelected && "bg-primary/10 ring-1 ring-primary"
      )}
      onClick={() => onSelect("field", field)}
    >
      <button
        className="shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <span className="min-w-0 flex-1 truncate">{field.name}</span>
      <Badge
        variant="outline"
        className={cn(
          "h-4 px-1.5 text-[9px] font-normal",
          fieldTypeColors[field.type]
        )}
      >
        {field.type}
      </Badge>
    </div>
  );
}
