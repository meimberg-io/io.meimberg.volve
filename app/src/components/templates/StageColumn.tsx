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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepCard } from "./StepCard";
import { reorderStepTemplates } from "@/lib/data/templates";
import type {
  StageTemplateWithSteps,
  StageTemplate,
  StepTemplate,
  FieldTemplate,
} from "@/types";

interface StageColumnProps {
  stage: StageTemplateWithSteps;
  onSelect: (
    type: "stage" | "step" | "field",
    item: StageTemplate | StepTemplate | FieldTemplate
  ) => void;
  selectedId: string | null;
  onAddStep: (stageId: string) => void;
  onAddField: (stepId: string) => void;
  onRefresh: () => void;
}

export function StageColumn({
  stage,
  onSelect,
  selectedId,
  onAddStep,
  onAddField,
  onRefresh,
}: StageColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleStepDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = stage.steps.findIndex((s) => s.id === active.id);
      const newIndex = stage.steps.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(stage.steps, oldIndex, newIndex).map(
        (s) => s.id
      );
      await reorderStepTemplates(stage.id, newOrder);
      onRefresh();
    },
    [stage, onRefresh]
  );

  const stepCount = stage.steps.length;
  const fieldCount = stage.steps.reduce(
    (acc, step) => acc + step.fields.length,
    0
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-[280px] shrink-0 rounded-xl border border-border bg-card",
        isDragging && "opacity-50",
        selectedId === stage.id && "ring-2 ring-primary"
      )}
    >
      {/* Stage Header */}
      <div
        className="flex cursor-pointer items-center gap-2 border-b border-border p-3"
        onClick={() => onSelect("stage", stage)}
      >
        <button
          className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{stage.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {stepCount} Steps
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {fieldCount} Fields
          </Badge>
        </div>
      </div>

      {/* Steps */}
      <div className="max-h-[500px] space-y-2 overflow-y-auto p-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleStepDragEnd}
        >
          <SortableContext
            items={stage.steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {stage.steps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                onSelect={onSelect}
                selectedId={selectedId}
                onAddField={onAddField}
                onRefresh={onRefresh}
              />
            ))}
          </SortableContext>
        </DndContext>

        {stage.steps.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Noch keine Steps
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground"
          onClick={() => onAddStep(stage.id)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Step hinzufügen
        </Button>
      </div>
    </div>
  );
}
