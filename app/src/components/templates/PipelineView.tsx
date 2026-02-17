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
import { Plus, ChevronRight, Sparkles, Pencil, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StageColumn } from "./StageColumn";
import { ProcessDescriptionModal } from "./ProcessDescriptionModal";
import { GenerateStructureModal } from "./GenerateStructureModal";
import { reorderStageTemplates, updateProcessModel, bulkUpdateDependencies } from "@/lib/data/templates";
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
  onRefresh: () => void;
}

export function PipelineView({
  model,
  setModel,
  onSelect,
  selectedId,
  onAddStage,
  onAddStep,
  onAddField,
  onRefresh,
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

  const [showDescModal, setShowDescModal] = useState(false);
  const [showGenStages, setShowGenStages] = useState(false);
  const [generatingDeps, setGeneratingDeps] = useState(false);

  const allFields = model.stages.flatMap((s) =>
    s.steps.flatMap((st) =>
      st.fields.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description ?? "",
        stepName: st.name,
        stageName: s.name,
      }))
    )
  );

  const handleGenerateDependencies = useCallback(async () => {
    if (allFields.length === 0) return;
    setGeneratingDeps(true);
    try {
      const fieldsList = allFields
        .map((f) => `- ID: ${f.id} | Name: "${f.name}" | Stage: "${f.stageName}" | Step: "${f.stepName}" | Beschreibung: ${f.description}`)
        .join("\n");

      const response = await fetch("/api/ai/template-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_dependencies",
          context: { fields_list: fieldsList },
        }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();

      const validFieldIds = new Set(allFields.map((f) => f.id));
      const updates = (data.dependencies ?? [])
        .filter((d: { field_id: string; depends_on: string[] }) =>
          validFieldIds.has(d.field_id) && d.depends_on.length > 0
        )
        .map((d: { field_id: string; depends_on: string[] }) => ({
          id: d.field_id,
          dependencies: d.depends_on.filter((id: string) => validFieldIds.has(id)),
        }))
        .filter((d: { id: string; dependencies: string[] }) => d.dependencies.length > 0);

      if (updates.length > 0) {
        await bulkUpdateDependencies(updates);
        onRefresh();
      }
    } catch (err) {
      console.error("Dependency generation failed:", err);
    } finally {
      setGeneratingDeps(false);
    }
  }, [allFields, onRefresh]);

  return (
    <div className="w-full">
      {/* Process description + AI buttons */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowDescModal(true)}
          >
            <Pencil className="h-3 w-3" />
            Prozessbeschreibung
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs text-amber-400 border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300"
            onClick={() => setShowGenStages(true)}
            disabled={!model.description}
            title={!model.description ? "Prozessbeschreibung wird zuerst benötigt" : undefined}
          >
            <Sparkles className="h-3 w-3" />
            Stages generieren
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs text-amber-400 border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300"
            onClick={handleGenerateDependencies}
            disabled={allFields.length === 0 || generatingDeps}
            title={allFields.length === 0 ? "Keine Fields vorhanden" : undefined}
          >
            {generatingDeps ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Link2 className="h-3 w-3" />
            )}
            {generatingDeps ? "Generiere..." : "Dependencies generieren"}
          </Button>
          {model.description && (
            <span className="text-xs text-muted-foreground/50 truncate max-w-[400px]">
              {model.description.slice(0, 100)}
              {model.description.length > 100 ? "..." : ""}
            </span>
          )}
        </div>
      </div>

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
                    processDescription={model.description ?? ""}
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
      </div>

      {/* Process Description Modal */}
      <ProcessDescriptionModal
        open={showDescModal}
        onOpenChange={setShowDescModal}
        description={model.description ?? ""}
        onSave={async (desc) => {
          await updateProcessModel(model.id, { description: desc || null });
          setModel((prev) => prev ? { ...prev, description: desc || null } : prev);
        }}
      />

      {/* Generate Stages Modal */}
      <GenerateStructureModal
        open={showGenStages}
        onOpenChange={setShowGenStages}
        mode="generate_stages"
        context={{ process_description: model.description ?? "" }}
        parentId={model.id}
        hasExisting={model.stages.length > 0}
        onComplete={onRefresh}
      />
    </div>
  );
}
