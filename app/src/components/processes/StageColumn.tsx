"use client";

import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiButton } from "@/components/ui/ai-button";
import { cn } from "@/lib/utils";
import { StepCard } from "./StepCard";
import { GenerateStructureModal } from "./GenerateStructureModal";
import type {
  StageWithSteps,
  Stage,
  Step,
  Field,
} from "@/types";

interface StageColumnProps {
  stage: StageWithSteps;
  stageNumber: number;
  onSelect: (
    type: "stage" | "step" | "field",
    item: Stage | Step | Field
  ) => void;
  selectedId: string | null;
  onAddStep: (stageId: string) => void;
  onAddField: (stepId: string) => void;
  processDescription: string;
  onRefresh: () => void;
}

export function StageColumn({
  stage,
  stageNumber,
  onSelect,
  selectedId,
  onAddStep,
  onAddField,
  processDescription,
  onRefresh,
}: StageColumnProps) {
  const [showGenSteps, setShowGenSteps] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stage.id,
    data: { type: "stage" },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `stage-droppable-${stage.id}`,
    data: { type: "stage-droppable", stageId: stage.id },
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
        "w-[280px] shrink-0 rounded-xl border border-border bg-card transition-colors [&:has(>[data-header]:hover)]:border-primary/40",
        isDragging && "opacity-50",
        selectedId === stage.id && "ring-2 ring-primary"
      )}
    >
      {/* Stage Header */}
      <div
        data-header
        className="flex cursor-pointer items-center gap-2 border-b border-border p-3 rounded-t-xl transition-colors hover:bg-muted"
        onClick={() => onSelect("stage", stage)}
      >
        <button
          className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
          {stageNumber}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{stage.name}</h3>
        </div>
      </div>

      {/* Steps (droppable area) */}
      <div ref={setDroppableRef} className="space-y-2 p-3 min-h-[40px]">
        <SortableContext
          items={stage.steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {stage.steps.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              stepLetter={String.fromCharCode(65 + idx)}
              stageId={stage.id}
              onSelect={onSelect}
              selectedId={selectedId}
              onAddField={onAddField}
            />
          ))}
        </SortableContext>

        {stage.steps.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Noch keine Steps
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3 space-y-1.5">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-1.5 text-xs cursor-pointer text-blue-400 border-blue-400/30 hover:bg-blue-400! hover:text-black! hover:border-blue-400!"
          onClick={() => onAddStep(stage.id)}
        >
          <Plus className="h-3 w-3" />
          Step hinzufügen
        </Button>
        <AiButton
          className="w-full justify-start"
          onClick={() => setShowGenSteps(true)}
          disabled={!processDescription && !stage.description}
        >
          Steps generieren
        </AiButton>
      </div>

      <GenerateStructureModal
        open={showGenSteps}
        onOpenChange={setShowGenSteps}
        mode="generate_steps"
        context={{
          stage_name: stage.name,
          stage_description: stage.description ?? "",
          process_description: processDescription,
        }}
        parentId={stage.id}
        hasExisting={stage.steps.length > 0}
        existingItems={stage.steps.map((s) => ({
          name: s.name,
          description: s.description ?? "",
        }))}
        onComplete={onRefresh}
      />
    </div>
  );
}
