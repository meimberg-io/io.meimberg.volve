"use client";

import { useState, useCallback, useRef, type SetStateAction } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineView } from "@/components/templates/PipelineView";
import { EditPanel } from "@/components/templates/EditPanel";
import { AddTemplateDialog } from "@/components/templates/AddTemplateDialog";
import { getProcessWithFullTree, updateProcess, ProcessWithStages } from "@/lib/data/templates";
import type {
  Stage,
  Step,
  Field,
} from "@/types";

type EditItem = {
  type: "stage" | "step" | "field";
  item: Stage | Step | Field;
};

type AddContext = {
  type: "stage" | "step" | "field";
  parentId: string;
} | null;

export default function TemplateDetailPage() {
  const params = useParams();
  const modelId = params.id as string;
  const queryClient = useQueryClient();

  const [editItem, setEditItem] = useState<EditItem | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addContext, setAddContext] = useState<AddContext>(null);
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { data: model = null, isLoading } = useQuery({
    queryKey: ["process-model", modelId],
    queryFn: () => getProcessWithFullTree(modelId),
    enabled: !!modelId,
  });

  const setModel = useCallback(
    (updater: SetStateAction<ProcessWithStages | null>) => {
      queryClient.setQueryData<ProcessWithStages | null>(
        ["process-model", modelId],
        (prev) =>
          typeof updater === "function" ? updater(prev ?? null) : updater
      );
    },
    [modelId, queryClient]
  );

  const refreshModel = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["process-model", modelId],
    });
  }, [modelId, queryClient]);

  const refreshAll = useCallback(() => {
    refreshModel();
    queryClient.invalidateQueries({ queryKey: ["templates"] });
  }, [refreshModel, queryClient]);

  const handleSelect = (
    type: "stage" | "step" | "field",
    item: Stage | Step | Field
  ) => {
    setEditItem({ type, item });
    setEditPanelOpen(true);
  };

  const handleAddStage = () => {
    setAddContext({ type: "stage", parentId: modelId });
    setShowAddDialog(true);
  };

  const handleAddStep = (stageId: string) => {
    setAddContext({ type: "step", parentId: stageId });
    setShowAddDialog(true);
  };

  const handleAddField = (stepId: string) => {
    setAddContext({ type: "field", parentId: stepId });
    setShowAddDialog(true);
  };

  const allFields: Field[] =
    model?.stages.flatMap((s) => s.steps.flatMap((st) => st.fields)) ?? [];

  const handleRename = useCallback(async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || !model || trimmed === model.name) {
      setEditingName(false);
      return;
    }
    await updateProcess(model.id, { name: trimmed });
    setModel((prev) => prev ? { ...prev, name: trimmed } : prev);
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    setEditingName(false);
  }, [model, setModel, queryClient]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/templates">
          <Button variant="ghost" size="icon-sm" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        {editingName ? (
          <input
            ref={nameInputRef}
            className="text-2xl font-bold bg-transparent border-b border-primary outline-none"
            defaultValue={model?.name ?? ""}
            autoFocus
            onBlur={(e) => handleRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(e.currentTarget.value);
              if (e.key === "Escape") setEditingName(false);
            }}
          />
        ) : (
          <button
            className="group flex items-center gap-2 cursor-pointer"
            onClick={() => setEditingName(true)}
          >
            <h1 className="text-2xl font-bold">
              {model?.name ?? "Lade..."}
            </h1>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Pipeline View */}
      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-[300px] rounded-xl" />
          ))}
        </div>
      ) : model ? (
        <PipelineView
          model={model}
          setModel={setModel}
          onSelect={handleSelect}
          selectedId={editPanelOpen ? (editItem?.item.id ?? null) : null}
          onAddStage={handleAddStage}
          onAddStep={handleAddStep}
          onAddField={handleAddField}
          onRefresh={refreshModel}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="mb-1 text-lg font-medium">Modell nicht gefunden</h3>
          <p className="text-sm text-muted-foreground">
            Das Prozessmodell existiert nicht oder wurde gelöscht.
          </p>
        </div>
      )}

      {/* Edit Panel */}
      <EditPanel
        open={editPanelOpen}
        onOpenChange={setEditPanelOpen}
        editItem={editItem}
        model={model}
        onRefresh={refreshAll}
        allFields={allFields}
      />

      {/* Add Dialog */}
      {addContext && (
        <AddTemplateDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          context={addContext}
          onCreated={refreshModel}
        />
      )}
    </div>
  );
}
