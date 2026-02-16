"use client";

import { useCallback, useRef, useState, useEffect, type Dispatch, type SetStateAction } from "react";
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
  setModel: Dispatch<SetStateAction<ProcessModelWithTemplates | null>>;
  onSelect: (
    type: "stage" | "step" | "field",
    item: StageTemplate | StepTemplate | FieldTemplate
  ) => void;
  selectedId: string | null;
  onAddStage: () => void;
  onAddStep: (stageId: string) => void;
  onAddField: (stepId: string) => void;
}

export function PipelineView({
  model,
  setModel,
  onSelect,
  selectedId,
  onAddStage,
  onAddStep,
  onAddField,
}: PipelineViewProps) {
  const topBarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScrollWidth(el.scrollWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [model]);

  const syncScroll = useCallback((source: "top" | "content") => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const from = source === "top" ? topBarRef.current : contentRef.current;
    const to = source === "top" ? contentRef.current : topBarRef.current;
    if (from && to) to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleStageDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = model.stages.findIndex((s) => s.id === active.id);
      const newIdx = model.stages.findIndex((s) => s.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(model.stages, oldIdx, newIdx);
      setModel((prev) => prev ? { ...prev, stages: reordered } : prev);
      reorderStageTemplates(model.id, reordered.map((s) => s.id));
    },
    [model, setModel]
  );

  return (
    <div className="w-full">
      {/* Top scrollbar */}
      <div
        ref={topBarRef}
        onScroll={() => syncScroll("top")}
        className="overflow-x-auto overflow-y-hidden [scrollbar-color:var(--color-border)_var(--color-muted)] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
      >
        <div style={{ width: scrollWidth, height: 1 }} />
      </div>

      <div className="h-3" />

      {/* Content with hidden scrollbar */}
      <div
        ref={contentRef}
        onScroll={() => syncScroll("content")}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="inline-flex items-start gap-0 pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleStageDragEnd}
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
                    stageNumber={index + 1}
                    setModel={setModel}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    onAddStep={onAddStep}
                    onAddField={onAddField}
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
      </div>
    </div>
  );
}
