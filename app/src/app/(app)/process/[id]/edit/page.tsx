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
import { getProcessWithFullTree, type ProcessWithStages } from "@/lib/data/templates";
import type { Stage, Step, Field } from "@/types";

type EditItem = {
  type: "stage" | "step" | "field";
  item: Stage | Step | Field;
};

type AddContext = {
  type: "stage" | "step" | "field";
  parentId: string;
} | null;

export default function ProcessEditPage() {
  const params = useParams();
  const processId = params.id as string;
  const queryClient = useQueryClient();

  const [editItem, setEditItem] = useState<EditItem | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addContext, setAddContext] = useState<AddContext>(null);

  const { data: model = null, isLoading } = useQuery({
    queryKey: ["process-edit", processId],
    queryFn: () => getProcessWithFullTree(processId),
    enabled: !!processId,
  });

  const setModel = useCallback(
    (updater: SetStateAction<ProcessWithStages | null>) => {
      queryClient.setQueryData<ProcessWithStages | null>(
        ["process-edit", processId],
        (prev) =>
          typeof updater === "function" ? updater(prev ?? null) : updater
      );
    },
    [processId, queryClient]
  );

  const refreshModel = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["process-edit", processId],
    });
  }, [processId, queryClient]);

  const handleSelect = (
    type: "stage" | "step" | "field",
    item: Stage | Step | Field
  ) => {
    setEditItem({ type, item });
    setEditPanelOpen(true);
  };

  const handleAddStage = () => {
    setAddContext({ type: "stage", parentId: processId });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/process/${processId}`}>
          <Button variant="ghost" size="icon-sm" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {model?.name ?? "Lade..."}{" "}
          <span className="text-base font-normal text-muted-foreground">bearbeiten</span>
        </h1>
      </div>

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
          <h3 className="mb-1 text-lg font-medium">Prozess nicht gefunden</h3>
          <p className="text-sm text-muted-foreground">
            Der Prozess existiert nicht oder wurde gelöscht.
          </p>
        </div>
      )}

      <EditPanel
        open={editPanelOpen}
        onOpenChange={setEditPanelOpen}
        editItem={editItem}
        model={model}
        onRefresh={refreshModel}
        allFields={allFields}
      />

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
