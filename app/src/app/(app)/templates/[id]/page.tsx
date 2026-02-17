"use client";

import { useState, useCallback, type SetStateAction } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineView } from "@/components/templates/PipelineView";
import { EditPanel } from "@/components/templates/EditPanel";
import { AddTemplateDialog } from "@/components/templates/AddTemplateDialog";
import { getProcessModelWithTemplates } from "@/lib/data/templates";
import type {
  ProcessModelWithTemplates,
  StageTemplate,
  StepTemplate,
  FieldTemplate,
} from "@/types";

type EditItem = {
  type: "stage" | "step" | "field";
  item: StageTemplate | StepTemplate | FieldTemplate;
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

  const { data: model = null, isLoading } = useQuery({
    queryKey: ["process-model", modelId],
    queryFn: () => getProcessModelWithTemplates(modelId),
    enabled: !!modelId,
  });

  const setModel = useCallback(
    (updater: SetStateAction<ProcessModelWithTemplates | null>) => {
      queryClient.setQueryData<ProcessModelWithTemplates | null>(
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
    queryClient.invalidateQueries({ queryKey: ["process-models"] });
  }, [refreshModel, queryClient]);

  const handleSelect = (
    type: "stage" | "step" | "field",
    item: StageTemplate | StepTemplate | FieldTemplate
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

  const allFields: FieldTemplate[] =
    model?.stages.flatMap((s) => s.steps.flatMap((st) => st.fields)) ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/templates">
          <Button variant="ghost" size="icon-sm" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {model?.name ?? "Lade..."}
        </h1>
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
