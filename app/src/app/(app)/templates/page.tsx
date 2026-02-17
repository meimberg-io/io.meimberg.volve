"use client";

import { useState, useCallback, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineView } from "@/components/templates/PipelineView";
import { EditPanel } from "@/components/templates/EditPanel";
import { AddTemplateDialog } from "@/components/templates/AddTemplateDialog";
import {
  getProcessModels,
  getProcessModelWithTemplates,
} from "@/lib/data/templates";
import type {
  ProcessModel,
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
  type: "model" | "stage" | "step" | "field";
  parentId?: string;
} | null;

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<EditItem | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addContext, setAddContext] = useState<AddContext>(null);

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["process-models"],
    queryFn: getProcessModels,
  });

  // Auto-select first model when models load and nothing is selected
  if (models.length > 0 && !selectedModelId) {
    setSelectedModelId(models[0].id);
  }

  const { data: model = null } = useQuery({
    queryKey: ["process-model", selectedModelId],
    queryFn: () => getProcessModelWithTemplates(selectedModelId!),
    enabled: !!selectedModelId,
  });

  // Wrapper for PipelineView: updates the query cache like a setState
  const setModel = useCallback(
    (updater: SetStateAction<ProcessModelWithTemplates | null>) => {
      queryClient.setQueryData<ProcessModelWithTemplates | null>(
        ["process-model", selectedModelId],
        (prev) =>
          typeof updater === "function" ? updater(prev ?? null) : updater
      );
    },
    [selectedModelId, queryClient]
  );

  const refreshModel = useCallback(() => {
    if (selectedModelId) {
      queryClient.invalidateQueries({
        queryKey: ["process-model", selectedModelId],
      });
    }
  }, [selectedModelId, queryClient]);

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
    if (!selectedModelId) return;
    setAddContext({ type: "stage", parentId: selectedModelId });
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

  const handleAddModel = () => {
    setAddContext({ type: "model" });
    setShowAddDialog(true);
  };

  const handleCreated = async () => {
    if (addContext?.type === "model") {
      const freshModels = await getProcessModels();
      queryClient.setQueryData<ProcessModel[]>(
        ["process-models"],
        freshModels
      );
      if (freshModels.length > 0) {
        setSelectedModelId(freshModels[freshModels.length - 1].id);
      }
    } else {
      refreshModel();
    }
  };

  const loading = modelsLoading;

  const allFields: FieldTemplate[] =
    model?.stages.flatMap((s) => s.steps.flatMap((st) => st.fields)) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Template Editor</h1>
          <p className="text-muted-foreground">
            Prozessmodelle und Templates verwalten
          </p>
        </div>
        <div className="flex items-center gap-3">
          {models.length > 0 && (
            <Select
              value={selectedModelId ?? undefined}
              onValueChange={setSelectedModelId}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Modell wählen..." />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleAddModel} variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Neues Modell
          </Button>
        </div>
      </div>

      {/* Pipeline View */}
      {loading ? (
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
          selectedId={editItem?.item.id ?? null}
          onAddStage={handleAddStage}
          onAddStep={handleAddStep}
          onAddField={handleAddField}
          onRefresh={refreshModel}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="mb-1 text-lg font-medium">Kein Modell vorhanden</h3>
          <p className="text-sm text-muted-foreground">
            Erstelle ein neues Prozessmodell, um zu beginnen.
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
      <AddTemplateDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        context={addContext}
        onCreated={handleCreated}
      />
    </div>
  );
}
