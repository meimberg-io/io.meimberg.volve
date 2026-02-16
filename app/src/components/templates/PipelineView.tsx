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
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StageColumn } from "./StageColumn";
import { reorderStageTemplates } from "@/lib/data/templates";
import type {
  ProcessModelWithTemplates,
  StageTemplate,
  StepTemplate,
  FieldTemplate,
} from "@/types";

interface PipelineViewProps {
  model: ProcessModelWithTemplates;
  onSelect: (
    type: "stage" | "step" | "field",
    item: StageTemplate | StepTemplate | FieldTemplate
  ) => void;
  selectedId: string | null;
  onAddStage: () => void;
  onAddStep: (stageId: string) => void;
  onAddField: (stepId: string) => void;
  onRefresh: () => void;
}

export function PipelineView({
  model,
  onSelect,
  selectedId,
  onAddStage,
  onAddStep,
  onAddField,
  onRefresh,
}: PipelineViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = model.stages.findIndex((s) => s.id === active.id);
      const newIndex = model.stages.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(model.stages, oldIndex, newIndex).map(
        (s) => s.id
      );
      await reorderStageTemplates(model.id, newOrder);
      onRefresh();
    },
    [model, onRefresh]
  );

  return (
    <ScrollArea className="w-full">
      <div className="flex items-start gap-0 pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={model.stages.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            {model.stages.map((stage, index) => (
              <div key={stage.id} className="flex items-start">
                {index > 0 && (
                  <div className="flex shrink-0 items-center self-center px-1 pt-10">
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
                <StageColumn
                  stage={stage}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  onAddStep={onAddStep}
                  onAddField={onAddField}
                  onRefresh={onRefresh}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Stage button */}
        <div className="flex shrink-0 items-center self-center px-1 pt-10">
          {model.stages.length > 0 && (
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex shrink-0 self-center pt-10">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddStage}
            className="border-dashed"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Stage
          </Button>
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
