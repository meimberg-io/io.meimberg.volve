"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AiButton } from "@/components/ui/ai-button";
import { MarkdownField } from "@/components/field/MarkdownField";
import { PromptField } from "@/components/field/PromptField";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  updateStageTemplate,
  updateStepTemplate,
  updateFieldTemplate,
  deleteStageTemplate,
  deleteStepTemplate,
  deleteFieldTemplate,
  getTemplateInstanceCount,
} from "@/lib/data/templates";
import { GenerateDescriptionModal } from "./GenerateDescriptionModal";
import type {
  ProcessModelWithTemplates,
  StageTemplate,
  StepTemplate,
  FieldTemplate,
  FieldType,
} from "@/types";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "long_text", label: "Long Text" },
  { value: "file", label: "File" },
  { value: "file_list", label: "File List" },
  { value: "task", label: "Task" },
];

interface EditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: {
    type: "stage" | "step" | "field";
    item: StageTemplate | StepTemplate | FieldTemplate;
  } | null;
  model: ProcessModelWithTemplates | null;
  onRefresh: () => void;
  allFields: FieldTemplate[];
}

export function EditPanel({
  open,
  onOpenChange,
  editItem,
  model,
  onRefresh,
  allFields,
}: EditPanelProps) {
  const [instanceCount, setInstanceCount] = useState<number>(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!editItem) return;
    getTemplateInstanceCount(editItem.type, editItem.item.id).then(
      setInstanceCount
    );
  }, [editItem]);

  const handleDelete = async () => {
    if (!editItem) return;
    setDeleting(true);
    try {
      if (editItem.type === "stage") {
        await deleteStageTemplate(editItem.item.id);
      } else if (editItem.type === "step") {
        await deleteStepTemplate(editItem.item.id);
      } else {
        await deleteFieldTemplate(editItem.item.id);
      }
      setShowDeleteDialog(false);
      onOpenChange(false);
      onRefresh();
    } finally {
      setDeleting(false);
    }
  };

  const typeLabel =
    editItem?.type === "stage"
      ? "Stage"
      : editItem?.type === "step"
        ? "Step"
        : "Field";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="text-sm">
              {typeLabel} bearbeiten
            </SheetTitle>
            <SheetDescription className="text-xs">
              Eigenschaften des Templates anpassen
            </SheetDescription>
          </SheetHeader>

          {editItem && (
            <div className="mt-4 space-y-5 px-4">
              {editItem.type === "stage" && (
                <StageForm
                  key={editItem.item.id}
                  stage={editItem.item as StageTemplate}
                  processDescription={model?.description ?? ""}
                  onRefresh={onRefresh}
                />
              )}
              {editItem.type === "step" && (
                <StepForm
                  key={editItem.item.id}
                  step={editItem.item as StepTemplate}
                  model={model}
                  onRefresh={onRefresh}
                />
              )}
              {editItem.type === "field" && (
                <FieldForm
                  key={editItem.item.id}
                  field={editItem.item as FieldTemplate}
                  allFields={allFields}
                  onRefresh={onRefresh}
                />
              )}

              <Separator />

              {/* Instance count & delete */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Instanzen:</span>
                  <Badge variant="secondary" className="text-[10px]">{instanceCount}</Badge>
                </div>

                {instanceCount > 0 && (
                  <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>
                      Dieses Template wird von {instanceCount} Instanz
                      {instanceCount !== 1 && "en"} verwendet und kann nicht
                      gelöscht werden.
                    </span>
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full gap-1.5 text-xs cursor-pointer bg-red-500/80 text-white hover:bg-red-500"
                  disabled={instanceCount > 0}
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3 w-3" />
                  {typeLabel} löschen
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{typeLabel} löschen?</DialogTitle>
            <DialogDescription>
              Möchtest du &ldquo;{editItem?.item.name}&rdquo; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => setShowDeleteDialog(false)}
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs cursor-pointer bg-red-500/80 text-white hover:bg-red-500"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Löschen..." : "Endgültig löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// =============================================
// Stage Form
// =============================================

function StageForm({
  stage,
  processDescription,
  onRefresh,
}: {
  stage: StageTemplate;
  processDescription: string;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(stage.name);
  const [description, setDescription] = useState(stage.description ?? "");
  const [icon, setIcon] = useState(stage.icon ?? "");
  const [modalMode, setModalMode] = useState<"describe_stage" | "optimize_description" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = useCallback(
    (data: Partial<Pick<StageTemplate, "name" | "description" | "icon">>) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await updateStageTemplate(stage.id, data);
        onRefresh();
      }, 500);
    },
    [stage.id, onRefresh]
  );

  const hasDescription = description.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="stage-name" className="text-xs">Name</Label>
        <Input
          id="stage-name"
          value={name}
          className="text-xs!"
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="stage-description" className="text-xs">Beschreibung</Label>
          <div className="flex gap-1.5">
            <AiButton
              onClick={() => setModalMode("describe_stage")}
              disabled={!processDescription}
              title={!processDescription ? "Prozessbeschreibung erforderlich" : undefined}
            >
              Generieren
            </AiButton>
            <AiButton
              onClick={() => setModalMode("optimize_description")}
              disabled={!processDescription || !hasDescription}
              title={!hasDescription ? "Erst eine Beschreibung erstellen" : !processDescription ? "Prozessbeschreibung erforderlich" : undefined}
            >
              Optimieren
            </AiButton>
          </div>
        </div>
        <MarkdownField
          content={description}
          onChange={(val) => {
            setDescription(val);
            save({ description: val || null });
          }}
          placeholder="Beschreibung der Stage..."
          maxHeight="250px"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stage-icon" className="text-xs">Icon</Label>
        <Input
          id="stage-icon"
          value={icon}
          placeholder="z.B. file-text"
          className="text-xs!"
          onChange={(e) => {
            setIcon(e.target.value);
            save({ icon: e.target.value || null });
          }}
        />
      </div>

      {modalMode && (
        <GenerateDescriptionModal
          open={!!modalMode}
          onOpenChange={(open) => { if (!open) setModalMode(null); }}
          mode={modalMode}
          context={
            modalMode === "optimize_description"
              ? { current_description: description, stage_name: name, process_description: processDescription }
              : { stage_name: name, process_description: processDescription }
          }
          title={modalMode === "optimize_description" ? "Stage-Beschreibung optimieren" : "Stage-Beschreibung generieren"}
          onApply={(desc) => {
            setDescription(desc);
            save({ description: desc });
          }}
        />
      )}
    </div>
  );
}

// =============================================
// Step Form
// =============================================

function StepForm({
  step,
  model,
  onRefresh,
}: {
  step: StepTemplate;
  model: ProcessModelWithTemplates | null;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(step.name);
  const [description, setDescription] = useState(step.description ?? "");
  const [modalMode, setModalMode] = useState<"describe_step" | "optimize_description" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = useCallback(
    (data: Partial<Pick<StepTemplate, "name" | "description">>) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await updateStepTemplate(step.id, data);
        onRefresh();
      }, 500);
    },
    [step.id, onRefresh]
  );

  const parentStage = model?.stages.find((s) =>
    s.steps.some((st) => st.id === step.id)
  );
  const processDescription = model?.description ?? "";
  const hasContext = !!processDescription;
  const hasDescription = description.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="step-name" className="text-xs">Name</Label>
        <Input
          id="step-name"
          value={name}
          className="text-xs!"
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="step-description" className="text-xs">Beschreibung</Label>
          <div className="flex gap-1.5">
            <AiButton
              onClick={() => setModalMode("describe_step")}
              disabled={!hasContext}
              title={!hasContext ? "Prozessbeschreibung erforderlich" : undefined}
            >
              Generieren
            </AiButton>
            <AiButton
              onClick={() => setModalMode("optimize_description")}
              disabled={!hasContext || !hasDescription}
              title={!hasDescription ? "Erst eine Beschreibung erstellen" : !hasContext ? "Prozessbeschreibung erforderlich" : undefined}
            >
              Optimieren
            </AiButton>
          </div>
        </div>
        <MarkdownField
          content={description}
          onChange={(val) => {
            setDescription(val);
            save({ description: val || null });
          }}
          placeholder="Beschreibung des Steps..."
          maxHeight="250px"
        />
      </div>

      {modalMode && (
        <GenerateDescriptionModal
          open={!!modalMode}
          onOpenChange={(open) => { if (!open) setModalMode(null); }}
          mode={modalMode}
          context={
            modalMode === "optimize_description"
              ? { current_description: description, step_name: name, stage_name: parentStage?.name ?? "", stage_description: parentStage?.description ?? "", process_description: processDescription }
              : { step_name: name, stage_name: parentStage?.name ?? "", stage_description: parentStage?.description ?? "", process_description: processDescription }
          }
          title={modalMode === "optimize_description" ? "Step-Beschreibung optimieren" : "Step-Beschreibung generieren"}
          onApply={(desc) => {
            setDescription(desc);
            save({ description: desc });
          }}
        />
      )}
    </div>
  );
}

// =============================================
// Field Form
// =============================================

function FieldForm({
  field,
  allFields,
  onRefresh,
}: {
  field: FieldTemplate;
  allFields: FieldTemplate[];
  onRefresh: () => void;
}) {
  const [name, setName] = useState(field.name);
  const [description, setDescription] = useState(field.description ?? "");
  const [type, setType] = useState<FieldType>(field.type);
  const [aiPrompt, setAiPrompt] = useState(field.ai_prompt ?? "");
  const [dependencies, setDependencies] = useState<string[]>(
    field.dependencies ?? []
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = useCallback(
    (
      data: Partial<
        Pick<
          FieldTemplate,
          "name" | "description" | "type" | "ai_prompt" | "dependencies"
        >
      >
    ) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await updateFieldTemplate(field.id, data);
        onRefresh();
      }, 500);
    },
    [field.id, onRefresh]
  );

  const otherFields = allFields.filter((f) => f.id !== field.id);

  const toggleDependency = (depId: string) => {
    const newDeps = dependencies.includes(depId)
      ? dependencies.filter((d) => d !== depId)
      : [...dependencies, depId];
    setDependencies(newDeps);
    save({ dependencies: newDeps.length > 0 ? newDeps : null });
  };

  const removeDependency = (depId: string) => {
    const newDeps = dependencies.filter((d) => d !== depId);
    setDependencies(newDeps);
    save({ dependencies: newDeps.length > 0 ? newDeps : null });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="field-name" className="text-xs">Name</Label>
        <Input
          id="field-name"
          value={name}
          className="text-xs!"
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="field-description" className="text-xs">Beschreibung</Label>
        <Textarea
          id="field-description"
          value={description}
          rows={2}
          className="text-xs!"
          onChange={(e) => {
            setDescription(e.target.value);
            save({ description: e.target.value || null });
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Typ</Label>
        <Select
          value={type}
          onValueChange={(value: FieldType) => {
            setType(value);
            save({ type: value });
          }}
        >
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((ft) => (
              <SelectItem key={ft.value} value={ft.value}>
                {ft.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="field-ai-prompt" className="text-xs">AI Prompt</Label>
        <PromptField
          id="field-ai-prompt"
          value={aiPrompt}
          rows={4}
          placeholder="Anweisungen für die KI-Generierung..."
          onChange={(e) => {
            setAiPrompt(e.target.value);
            save({ ai_prompt: e.target.value || null });
          }}
        />
      </div>

      {/* Dependencies */}
      <div className="space-y-1.5">
        <Label className="text-xs">Abhängigkeiten</Label>

        {/* Selected dependencies */}
        {dependencies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dependencies.map((depId) => {
              const depField = allFields.find((f) => f.id === depId);
              return (
                <Badge
                  key={depId}
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5 text-[10px]"
                  onClick={() => removeDependency(depId)}
                >
                  {depField?.name ?? depId}
                  <span className="text-muted-foreground">&times;</span>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Available fields to add */}
        {otherFields.length > 0 && (
          <Select
            value=""
            onValueChange={(value) => {
              if (value) toggleDependency(value);
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Abhängigkeit hinzufügen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Verfügbare Fields</SelectLabel>
                {otherFields
                  .filter((f) => !dependencies.includes(f.id))
                  .map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
