"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldItem } from "./FieldItem";
import type {
  StepWithFields,
  Stage,
  Step,
  Field,
} from "@/types";

interface StepCardProps {
  step: StepWithFields;
  stepLetter: string;
  stageId: string;
  onSelect: (
    type: "stage" | "step" | "field",
    item: Stage | Step | Field
  ) => void;
  selectedId: string | null;
  onAddField: (stepId: string) => void;
}

export function StepCard({
  step,
  stepLetter,
  stageId,
  onSelect,
  selectedId,
  onAddField,
}: StepCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    data: { type: "step", stageId },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `step-droppable-${step.id}`,
    data: { type: "step-droppable", stepId: step.id },
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
        "rounded-lg border border-border bg-background transition-colors [&:has([data-header]:hover)]:border-primary/40",
        isDragging && "opacity-50",
        selectedId === step.id && "ring-2 ring-primary"
      )}
    >
      {/* Step Header */}
      <div
        data-header
        className="flex cursor-pointer items-center gap-2 p-2.5 rounded-t-lg transition-colors hover:bg-muted"
        onClick={() => onSelect("step", step)}
      >
        <button
          className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-500">
          {stepLetter}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {step.name}
        </span>
      </div>

      {/* Fields (droppable area) */}
      <div
        ref={setDroppableRef}
        className={cn(
          "border-t border-border/50 px-2 py-1.5",
          step.fields.length === 0 && "min-h-[28px]"
        )}
      >
        <SortableContext
          items={step.fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {step.fields.length > 0 ? (
            <div className="space-y-0.5">
              {step.fields.map((field) => (
                <FieldItem
                  key={field.id}
                  field={field}
                  onSelect={onSelect}
                  isSelected={selectedId === field.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-[10px] text-muted-foreground/50 py-1">
              Keine Fields
            </p>
          )}
        </SortableContext>
      </div>

      {/* Add Field */}
      <div className="border-t border-border/50 px-1 py-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-full justify-start text-[10px] text-muted-foreground cursor-pointer"
          onClick={() => onAddField(step.id)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Field
        </Button>
      </div>
    </div>
  );
}
