"use client";

import { useCallback, useRef, useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, ChevronRight, Sparkles, FileCheck, FileX, Loader2, Link2, ImageIcon, MoreHorizontal, Download, Copy, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StageColumn } from "./StageColumn";
import { ProcessDescriptionModal } from "./ProcessDescriptionModal";
import { GenerateStructureModal } from "./GenerateStructureModal";
import { HeaderImageModal } from "./HeaderImageModal";
import {
  reorderStages,
  reorderSteps,
  reorderFields,
  moveStep,
  moveField,
  updateProcess,
  bulkUpdateDependencies,
    downloadProcessExport,
  copyProcess,
  type ProcessWithStages,
} from "@/lib/data/processes";
import type {
  Stage,
  Step,
  Field,
  StepWithFields,
  FieldType,
} from "@/types";

type DragItemType = "stage" | "step" | "field";

const fieldTypeColors: Record<FieldType, string> = {
  text: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  long_text: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  file: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  file_list: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  task: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  task_list: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

interface PipelineViewProps {
  model: ProcessWithStages;
  setModel: Dispatch<SetStateAction<ProcessWithStages | null>>;
  onSelect: (
    type: "stage" | "step" | "field",
    item: Stage | Step | Field
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

  // ── Unified DnD state ────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<DragItemType | null>(null);
  const originalContainerRef = useRef<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as DragItemType | undefined;
    setActiveId(active.id as string);
    setActiveType(type ?? null);

    if (type === "step") {
      originalContainerRef.current = active.data.current?.stageId ?? null;
    } else if (type === "field") {
      originalContainerRef.current = active.data.current?.stepId ?? null;
    } else {
      originalContainerRef.current = null;
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeType) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData || !overData) return;

    // ── Step cross-container ───────────────────────────
    if (activeType === "step") {
      let targetStageId: string | null = null;

      if (overData.type === "step" && overData.stageId) {
        targetStageId = overData.stageId as string;
      } else if (overData.type === "stage-droppable" && overData.stageId) {
        targetStageId = overData.stageId as string;
      }

      if (!targetStageId) return;

      const activeStepId = active.id as string;

      setModel((prev) => {
        if (!prev) return prev;

        const sourceStage = prev.stages.find((s) =>
          s.steps.some((st) => st.id === activeStepId)
        );
        if (!sourceStage || sourceStage.id === targetStageId) return prev;

        const movingStep = sourceStage.steps.find((st) => st.id === activeStepId);
        if (!movingStep) return prev;

        const overStepId = overData.type === "step" ? (over.id as string) : null;

        return {
          ...prev,
          stages: prev.stages.map((stage) => {
            if (stage.id === sourceStage.id) {
              return { ...stage, steps: stage.steps.filter((st) => st.id !== activeStepId) };
            }
            if (stage.id === targetStageId) {
              const updatedStep = { ...movingStep, stage_id: stage.id };
              if (overStepId) {
                const overIdx = stage.steps.findIndex((st) => st.id === overStepId);
                const newSteps = [...stage.steps];
                newSteps.splice(overIdx >= 0 ? overIdx : newSteps.length, 0, updatedStep);
                return { ...stage, steps: newSteps };
              }
              return { ...stage, steps: [...stage.steps, updatedStep] };
            }
            return stage;
          }),
        };
      });
    }

    // ── Field cross-container ──────────────────────────
    if (activeType === "field") {
      let targetStepId: string | null = null;

      if (overData.type === "field" && overData.stepId) {
        targetStepId = overData.stepId as string;
      } else if (overData.type === "step-droppable" && overData.stepId) {
        targetStepId = overData.stepId as string;
      }

      if (!targetStepId) return;

      const activeFieldId = active.id as string;

      setModel((prev) => {
        if (!prev) return prev;

        let sourceStep: StepWithFields | null = null;
        for (const stage of prev.stages) {
          for (const step of stage.steps) {
            if (step.fields.some((f) => f.id === activeFieldId)) {
              sourceStep = step;
              break;
            }
          }
          if (sourceStep) break;
        }

        if (!sourceStep || sourceStep.id === targetStepId) return prev;

        const movingField = sourceStep.fields.find((f) => f.id === activeFieldId);
        if (!movingField) return prev;

        const overFieldId = overData.type === "field" ? (over.id as string) : null;

        return {
          ...prev,
          stages: prev.stages.map((stage) => ({
            ...stage,
            steps: stage.steps.map((step) => {
              if (step.id === sourceStep!.id) {
                return { ...step, fields: step.fields.filter((f) => f.id !== activeFieldId) };
              }
              if (step.id === targetStepId) {
                const updatedField = { ...movingField, step_id: step.id };
                if (overFieldId) {
                  const overIdx = step.fields.findIndex((f) => f.id === overFieldId);
                  const newFields = [...step.fields];
                  newFields.splice(overIdx >= 0 ? overIdx : newFields.length, 0, updatedField);
                  return { ...step, fields: newFields };
                }
                return { ...step, fields: [...step.fields, updatedField] };
              }
              return step;
            }),
          })),
        };
      });
    }
  }, [activeType, setModel]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveType(null);

      if (!over) {
        originalContainerRef.current = null;
        return;
      }

      const type = active.data.current?.type as DragItemType | undefined;

      // ── Stage reorder ────────────────────────────────
      if (type === "stage") {
        if (active.id === over.id) return;
        const oldIdx = model.stages.findIndex((s) => s.id === active.id);
        const newIdx = model.stages.findIndex((s) => s.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return;
        const reordered = arrayMove(model.stages, oldIdx, newIdx);
        setModel((prev) => prev ? { ...prev, stages: reordered } : prev);
        reorderStages(model.id, reordered.map((s) => s.id));
        originalContainerRef.current = null;
        return;
      }

      // ── Step reorder / move ──────────────────────────
      if (type === "step") {
        const originalStageId = originalContainerRef.current;
        originalContainerRef.current = null;

        const currentStage = model.stages.find((s) =>
          s.steps.some((st) => st.id === active.id)
        );
        if (!currentStage) return;

        let finalSteps = currentStage.steps;

        if (active.id !== over.id) {
          const overData = over.data.current;
          const isOverStep = overData?.type === "step";
          if (isOverStep) {
            const overIdx = currentStage.steps.findIndex((st) => st.id === over.id);
            const activeIdx = currentStage.steps.findIndex((st) => st.id === active.id);
            if (overIdx !== -1 && activeIdx !== -1) {
              finalSteps = arrayMove(currentStage.steps, activeIdx, overIdx);
              setModel((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  stages: prev.stages.map((s) =>
                    s.id === currentStage.id ? { ...s, steps: finalSteps } : s
                  ),
                };
              });
            }
          }
        }

        const orderedIds = finalSteps.map((st) => st.id);
        const containerChanged = originalStageId && originalStageId !== currentStage.id;

        if (containerChanged) {
          moveStep(active.id as string, currentStage.id, orderedIds);
          const sourceStage = model.stages.find((s) => s.id === originalStageId);
          if (sourceStage) {
            const sourceIds = sourceStage.steps
              .filter((st) => st.id !== active.id)
              .map((st) => st.id);
            if (sourceIds.length > 0) reorderSteps(originalStageId, sourceIds);
          }
        } else {
          reorderSteps(currentStage.id, orderedIds);
        }
        return;
      }

      // ── Field reorder / move ─────────────────────────
      if (type === "field") {
        const originalStepId = originalContainerRef.current;
        originalContainerRef.current = null;

        let currentStep: StepWithFields | null = null;
        for (const stage of model.stages) {
          for (const step of stage.steps) {
            if (step.fields.some((f) => f.id === active.id)) {
              currentStep = step;
              break;
            }
          }
          if (currentStep) break;
        }
        if (!currentStep) return;

        let finalFields = currentStep.fields;

        if (active.id !== over.id) {
          const overData = over.data.current;
          const isOverField = overData?.type === "field";
          if (isOverField) {
            const overIdx = currentStep.fields.findIndex((f) => f.id === over.id);
            const activeIdx = currentStep.fields.findIndex((f) => f.id === active.id);
            if (overIdx !== -1 && activeIdx !== -1) {
              finalFields = arrayMove(currentStep.fields, activeIdx, overIdx);
              setModel((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  stages: prev.stages.map((stage) => ({
                    ...stage,
                    steps: stage.steps.map((step) =>
                      step.id === currentStep!.id ? { ...step, fields: finalFields } : step
                    ),
                  })),
                };
              });
            }
          }
        }

        const orderedIds = finalFields.map((f) => f.id);
        const containerChanged = originalStepId && originalStepId !== currentStep.id;

        if (containerChanged) {
          moveField(active.id as string, currentStep.id, orderedIds);
          let sourceStep: StepWithFields | null = null;
          for (const stage of model.stages) {
            for (const step of stage.steps) {
              if (step.id === originalStepId) {
                sourceStep = step;
                break;
              }
            }
            if (sourceStep) break;
          }
          if (sourceStep) {
            const sourceIds = sourceStep.fields
              .filter((f) => f.id !== active.id)
              .map((f) => f.id);
            if (sourceIds.length > 0) reorderFields(originalStepId, sourceIds);
          }
        } else {
          reorderFields(currentStep.id, orderedIds);
        }
        return;
      }
    },
    [model, setModel]
  );

  // ── Find active item for overlay ─────────────────────
  const activeStage = activeType === "stage"
    ? model.stages.find((s) => s.id === activeId)
    : null;
  const activeStep = activeType === "step"
    ? (() => { for (const s of model.stages) { const st = s.steps.find((st) => st.id === activeId); if (st) return st; } return null; })()
    : null;
  const activeField = activeType === "field"
    ? (() => { for (const s of model.stages) for (const st of s.steps) { const f = st.fields.find((f) => f.id === activeId); if (f) return f; } return null; })()
    : null;

  const router = useRouter();
  const [showDescModal, setShowDescModal] = useState(false);
  const [showGenStages, setShowGenStages] = useState(false);
  const [showHeaderImage, setShowHeaderImage] = useState(false);
  const [generatingDeps, setGeneratingDeps] = useState(false);
  const [copying, setCopying] = useState(false);

  const allFields = model.stages.flatMap((s, si) =>
    s.steps.flatMap((st, sti) =>
      st.fields.map((f, fi) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        description: f.description ?? "",
        stepName: st.name,
        stageName: s.name,
        stageIndex: si + 1,
        stepIndex: sti + 1,
        fieldIndex: fi + 1,
      }))
    )
  );

  const handleGenerateDependencies = useCallback(async () => {
    if (allFields.length === 0) return;
    setGeneratingDeps(true);
    try {
      const fieldsList = allFields
        .map((f) => `Stage ${f.stageIndex} "${f.stageName}" > Step ${f.stepIndex} "${f.stepName}" > Field ${f.fieldIndex} "${f.name}" (ID: ${f.id}, ${f.type}): ${f.description}`)
        .join("\n");

      const response = await fetch("/api/ai/process-generate", {
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

  const handleSaveAsNewProcess = useCallback(async () => {
    setCopying(true);
    try {
      const newProcess = await copyProcess(model.id, {
        is_process: true,
        name: `${model.name} (Kopie)`,
      });
      router.push(`/processes/${newProcess.id}`);
    } catch (err) {
      console.error("Copy failed:", err);
    } finally {
      setCopying(false);
    }
  }, [model.id, model.name, router]);


  return (
    <div className="w-full">
      {/* Process description + AI buttons */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 h-7 text-xs cursor-pointer ${
              model.description
                ? "text-blue-400 border-blue-400/30 hover:!bg-blue-400 hover:!text-black hover:!border-blue-400"
                : "text-red-400 border-red-400/30 hover:!bg-red-400 hover:!text-black hover:!border-red-400"
            }`}
            onClick={() => setShowDescModal(true)}
          >
            {model.description ? (
              <FileCheck className="h-3 w-3" />
            ) : (
              <FileX className="h-3 w-3" />
            )}
            Prozessbeschreibung
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 h-7 text-xs cursor-pointer ${
              model.header_image
                ? "text-blue-400 border-blue-400/30 hover:!bg-blue-400 hover:!text-black hover:!border-blue-400"
                : "text-red-400 border-red-400/30 hover:!bg-red-400 hover:!text-black hover:!border-red-400"
            }`}
            disabled={!model.description}
            onClick={() => setShowHeaderImage(true)}
            title={!model.description ? "Prozessbeschreibung wird zuerst benötigt" : undefined}
          >
            <ImageIcon className="h-3 w-3" />
            Headerbild
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs cursor-pointer text-amber-400 border-amber-400/30 hover:!bg-amber-400 hover:!text-black hover:!border-amber-400"
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
            className="gap-1.5 h-7 text-xs cursor-pointer text-amber-400 border-amber-400/30 hover:!bg-amber-400 hover:!text-black hover:!border-amber-400"
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

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!model.is_process && (
                  <>
                    <DropdownMenuItem
                      onClick={handleSaveAsNewProcess}
                      disabled={copying}
                      className="cursor-pointer gap-2"
                    >
                      {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      Als neuen Prozess speichern
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => downloadProcessExport(model)}
                  className="cursor-pointer gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportieren
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
        <div className="inline-flex items-start gap-0 p-1 pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
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
                    stageNumber={index + 1}
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

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={null}>
              {activeStage && (
                <div className="w-[280px] rounded-xl border border-primary bg-card p-3 shadow-lg opacity-90">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{activeStage.name}</span>
                  </div>
                </div>
              )}
              {activeStep && (
                <div className="w-[250px] rounded-lg border border-primary bg-background p-2.5 shadow-lg opacity-90">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{activeStep.name}</span>
                  </div>
                </div>
              )}
              {activeField && (
                <div className="w-[230px] rounded-md border border-primary bg-background px-2 py-1.5 shadow-lg opacity-90">
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate text-xs">{activeField.name}</span>
                    <Badge
                      variant="outline"
                      className={`ml-auto h-4 px-1.5 text-[9px] font-normal ${fieldTypeColors[activeField.type]}`}
                    >
                      {activeField.type === "task_list" ? "Task Liste" : activeField.type}
                    </Badge>
                  </div>
                </div>
              )}
            </DragOverlay>
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
        systemPrompt={model.ai_system_prompt ?? ""}
        onSave={async (desc, sysPrompt) => {
          await updateProcess(model.id, {
            description: desc || null,
            ai_system_prompt: sysPrompt || null,
          });
          setModel((prev) => prev ? {
            ...prev,
            description: desc || null,
            ai_system_prompt: sysPrompt || null,
          } : prev);
        }}
      />

      {/* Header Image Modal */}
      <HeaderImageModal
        open={showHeaderImage}
        onOpenChange={setShowHeaderImage}
        processId={model.id}
        processName={model.name}
        processDescription={model.description ?? ""}
        currentImage={model.header_image ?? null}
        onImageGenerated={(headerImage) => {
          setModel((prev) => prev ? { ...prev, header_image: headerImage } : prev);
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
        existingItems={model.stages.map((s) => ({
          name: s.name,
          description: s.description ?? "",
        }))}
        onComplete={onRefresh}
      />
    </div>
  );
}
