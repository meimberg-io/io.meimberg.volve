"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldItem } from "./FieldItem";
import { reorderFields, type ProcessWithStages } from "@/lib/data/templates";
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
  setModel: Dispatch<SetStateAction<ProcessWithStages | null>>;
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
  setModel,
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
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleFieldDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = step.fields.findIndex((f) => f.id === active.id);
      const newIdx = step.fields.findIndex((f) => f.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(step.fields, oldIdx, newIdx);
      setModel((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stages: prev.stages.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  steps: s.steps.map((st) =>
                    st.id === step.id ? { ...st, fields: reordered } : st
                  ),
                }
              : s
          ),
        };
      });
      reorderFields(step.id, reordered.map((f) => f.id));
    },
    [step, stageId, setModel]
  );

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

      {/* Fields */}
      {step.fields.length > 0 && (
        <div className="space-y-0.5 border-t border-border/50 px-2 py-1.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFieldDragEnd}
          >
            <SortableContext
              items={step.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {step.fields.map((field) => (
                <FieldItem
                  key={field.id}
                  field={field}
                  onSelect={onSelect}
                  isSelected={selectedId === field.id}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

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
