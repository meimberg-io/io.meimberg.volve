"use client";

import { useCallback } from "react";
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
import { reorderFieldTemplates } from "@/lib/data/templates";
import type {
  StepTemplateWithFields,
  StageTemplate,
  StepTemplate,
  FieldTemplate,
} from "@/types";

interface StepCardProps {
  step: StepTemplateWithFields;
  onSelect: (
    type: "stage" | "step" | "field",
    item: StageTemplate | StepTemplate | FieldTemplate
  ) => void;
  selectedId: string | null;
  onAddField: (stepId: string) => void;
  onRefresh: () => void;
}

export function StepCard({
  step,
  onSelect,
  selectedId,
  onAddField,
  onRefresh,
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
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = step.fields.findIndex((f) => f.id === active.id);
      const newIndex = step.fields.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(step.fields, oldIndex, newIndex).map(
        (f) => f.id
      );
      await reorderFieldTemplates(step.id, newOrder);
      onRefresh();
    },
    [step, onRefresh]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-background",
        isDragging && "opacity-50",
        selectedId === step.id && "ring-2 ring-primary"
      )}
    >
      {/* Step Header */}
      <div
        className="flex cursor-pointer items-center gap-2 p-2.5"
        onClick={() => onSelect("step", step)}
      >
        <button
          className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {step.name}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {step.fields.length} Fields
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
          className="h-6 w-full justify-start text-[10px] text-muted-foreground"
          onClick={() => onAddField(step.id)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Field
        </Button>
      </div>
    </div>
  );
}
