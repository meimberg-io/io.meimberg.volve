"use client";

import { useState, useCallback, useRef, type SetStateAction } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineView } from "@/components/processes/PipelineView";
import { EditPanel } from "@/components/processes/EditPanel";
import { AddProcessDialog } from "@/components/processes/AddProcessDialog";
import { getProcessWithFullTree, updateProcess, ProcessWithStages } from "@/lib/data/processes";
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

export default function ProcessDetailPage() {
  const params = useParams();
  const processId = params.id as string;
  const queryClient = useQueryClient();

  const [editItem, setEditItem] = useState<EditItem | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addContext, setAddContext] = useState<AddContext>(null);
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { data: process = null, isLoading } = useQuery({
    queryKey: ["process-detail", processId],
    queryFn: () => getProcessWithFullTree(processId),
    enabled: !!processId,
  });

  const setProcess = useCallback(
    (updater: SetStateAction<ProcessWithStages | null>) => {
      queryClient.setQueryData<ProcessWithStages | null>(
        ["process-detail", processId],
        (prev) =>
          typeof updater === "function" ? updater(prev ?? null) : updater
      );
    },
    [processId, queryClient]
  );

  const refreshProcess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["process-detail", processId],
    });
  }, [processId, queryClient]);

  const refreshAll = useCallback(() => {
    refreshProcess();
    queryClient.invalidateQueries({ queryKey: ["processes"] });
  }, [refreshProcess, queryClient]);

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
    process?.stages.flatMap((s) => s.steps.flatMap((st) => st.fields)) ?? [];

  const handleRename = useCallback(async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || !process || trimmed === process.name) {
      setEditingName(false);
      return;
    }
    await updateProcess(process.id, { name: trimmed });
    setProcess((prev) => prev ? { ...prev, name: trimmed } : prev);
    queryClient.invalidateQueries({ queryKey: ["processes"] });
    setEditingName(false);
  }, [process, setProcess, queryClient]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/processes">
          <Button variant="ghost" size="icon-sm" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        {editingName ? (
          <input
            ref={nameInputRef}
            className="text-2xl font-bold bg-transparent border-b border-primary outline-none"
            defaultValue={process?.name ?? ""}
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
              {process?.name ?? "Lade..."}
            </h1>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-[300px] rounded-xl" />
          ))}
        </div>
      ) : process ? (
        <PipelineView
          model={process}
          setModel={setProcess}
          onSelect={handleSelect}
          selectedId={editPanelOpen ? (editItem?.item.id ?? null) : null}
          onAddStage={handleAddStage}
          onAddStep={handleAddStep}
          onAddField={handleAddField}
          onRefresh={refreshProcess}
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
        model={process}
        onRefresh={refreshAll}
        allFields={allFields}
      />

      {addContext && (
        <AddProcessDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          context={addContext}
          onCreated={refreshProcess}
        />
      )}
    </div>
  );
}
