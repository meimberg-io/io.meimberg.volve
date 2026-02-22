"use client";

import { useState, useCallback, useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AiButton } from "@/components/ui/ai-button";
import { FormField } from "@/components/ui/form-actions";
import { MarkdownField } from "@/components/field/MarkdownField";
import { IconPicker } from "@/components/field/IconPicker";
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
  updateStage,
  updateStep,
  updateField,
  deleteStage,
  deleteStep,
  deleteField,
  type ProcessWithStages,
} from "@/lib/data/processes";
import { GenerateDescriptionModal } from "./GenerateDescriptionModal";
import { Checkbox } from "@/components/ui/checkbox";
import type { Stage, Step, Field, FieldType } from "@/types";
import type { ProcessWithStages as FullProcessWithStages } from "@/lib/data/processes";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "long_text", label: "Long Text" },
  { value: "file", label: "File" },
  { value: "file_list", label: "File List" },
  { value: "task", label: "Task" },
  { value: "task_list", label: "Task Liste" },
  { value: "dossier", label: "Dossier" },
];

interface EditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: {
    type: "stage" | "step" | "field";
    item: Stage | Step | Field;
  } | null;
  model: ProcessWithStages | null;
  onRefresh: () => void;
  allFields: Field[];
}

export function EditPanel({
  open,
  onOpenChange,
  editItem,
  model,
  onRefresh,
  allFields,
}: EditPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!editItem) return;
    setDeleting(true);
    try {
      if (editItem.type === "stage") {
        await deleteStage(editItem.item.id);
      } else if (editItem.type === "step") {
        await deleteStep(editItem.item.id);
      } else {
        await deleteField(editItem.item.id);
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
              Eigenschaften des Prozesses anpassen
            </SheetDescription>
          </SheetHeader>

          {editItem && (
            <div className="mt-4 space-y-5 px-4">
              {editItem.type === "stage" && (
                <StageForm
                  key={editItem.item.id}
                  stage={editItem.item as Stage}
                  processDescription={model?.description ?? ""}
                  onRefresh={onRefresh}
                />
              )}
              {editItem.type === "step" && (
                <StepForm
                  key={editItem.item.id}
                  step={editItem.item as Step}
                  model={model}
                  onRefresh={onRefresh}
                />
              )}
              {editItem.type === "field" && (
                <FieldForm
                  key={editItem.item.id}
                  field={editItem.item as Field}
                  model={model}
                  allFields={allFields}
                  onRefresh={onRefresh}
                />
              )}

              <Separator />

              {/* Delete */}
              <div className="space-y-3">
                <Button
                  size="sm"
                  className="w-full gap-1.5 text-xs cursor-pointer bg-red-500/80 text-white hover:bg-red-500"
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
  stage: Stage;
  processDescription: string;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(stage.name);
  const [description, setDescription] = useState(stage.description ?? "");
  const [icon, setIcon] = useState(stage.icon ?? "");
  const [stageSystemPrompt, setStageSystemPrompt] = useState(stage.ai_system_prompt ?? "");
  const [modalMode, setModalMode] = useState<"describe_stage" | "optimize_description" | null>(null);
  const [suggestingIcon, setSuggestingIcon] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = useCallback(
    (data: Partial<Pick<Stage, "name" | "description" | "icon" | "ai_system_prompt">>) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await updateStage(stage.id, data);
        onRefresh();
      }, 500);
    },
    [stage.id, onRefresh]
  );

  const hasDescription = description.trim().length > 0;

  const suggestIcon = useCallback(async () => {
    setSuggestingIcon(true);
    try {
      const response = await fetch("/api/ai/process-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "suggest_icon",
          context: { stage_name: name, stage_description: description },
        }),
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      if (data.icon) {
        setIcon(data.icon);
        save({ icon: data.icon });
      }
    } catch {
      // silently fail
    } finally {
      setSuggestingIcon(false);
    }
  }, [name, description, save]);

  return (
    <div className="space-y-4">
      <FormField label="Name" htmlFor="stage-name">
        <Input
          id="stage-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </FormField>
      <FormField
        label="Beschreibung"
        htmlFor="stage-description"
        actions={
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
        }
      >
        <MarkdownField
          content={description}
          onChange={(val) => {
            setDescription(val);
            save({ description: val || null });
          }}
          placeholder="Beschreibung der Stage..."
          maxHeight="250px"
        />
      </FormField>
      <FormField
        label="Icon"
        actions={
          <AiButton
            loading={suggestingIcon}
            disabled={suggestingIcon || !name.trim()}
            onClick={suggestIcon}
            title={!name.trim() ? "Stage-Name erforderlich" : undefined}
          >
            Vorschlagen
          </AiButton>
        }
      >
        <IconPicker
          value={icon}
          onChange={(val) => {
            setIcon(val);
            save({ icon: val || null });
          }}
        />
      </FormField>

      <Separator />

      <FormField label="System-Prompt (Stage-Override)" htmlFor="stage-system-prompt">
        <p className="text-[11px] text-muted-foreground">
          Überschreibt den Projekt-/Global-Prompt bei der Ausführung dieser Stage. Leer lassen für Fallback.
        </p>
        <PromptField
          id="stage-system-prompt"
          variant="execution"
          value={stageSystemPrompt}
          rows={3}
          placeholder="z.B. Du bist ein erfahrener UX-Designer..."
          onChange={(e) => {
            setStageSystemPrompt(e.target.value);
            save({ ai_system_prompt: e.target.value || null });
          }}
        />
      </FormField>

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
  step: Step;
  model: ProcessWithStages | null;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(step.name);
  const [description, setDescription] = useState(step.description ?? "");
  const [modalMode, setModalMode] = useState<"describe_step" | "optimize_description" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = useCallback(
    (data: Partial<Pick<Step, "name" | "description">>) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await updateStep(step.id, data);
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
      <FormField label="Name" htmlFor="step-name">
        <Input
          id="step-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </FormField>
      <FormField
        label="Beschreibung"
        htmlFor="step-description"
        actions={
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
        }
      >
        <MarkdownField
          content={description}
          onChange={(val) => {
            setDescription(val);
            save({ description: val || null });
          }}
          placeholder="Beschreibung des Steps..."
          maxHeight="250px"
        />
      </FormField>

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
  model,
  allFields,
  onRefresh,
}: {
  field: Field;
  model: ProcessWithStages | null;
  allFields: Field[];
  onRefresh: () => void;
}) {
  const [name, setName] = useState(field.name);
  const [description, setDescription] = useState(field.description ?? "");
  const [type, setType] = useState<FieldType>(field.type);
  const [aiPrompt, setAiPrompt] = useState(field.ai_prompt ?? "");
  const [dependencies, setDependencies] = useState<string[]>(
    field.dependencies ?? []
  );
  const [dossierFieldIds, setDossierFieldIds] = useState<string[]>(
    field.dossier_field_ids ?? []
  );
  const [modalMode, setModalMode] = useState<"generate_field_prompt" | "optimize_field_prompt" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isDossier = type === "dossier";

  const save = useCallback(
    (
      data: Partial<
        Pick<
          Field,
          "name" | "description" | "type" | "ai_prompt" | "dependencies" | "dossier_field_ids"
        >
      >
    ) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await updateField(field.id, data);
        onRefresh();
      }, 500);
    },
    [field.id, onRefresh]
  );

  const parentStep = model?.stages
    .flatMap((s) => s.steps)
    .find((st) => st.fields?.some((f) => f.id === field.id));
  const parentStage = model?.stages.find((s) =>
    s.steps.some((st) => st.id === parentStep?.id)
  );
  const processDescription = model?.description ?? "";
  const hasPrompt = aiPrompt.trim().length > 0;

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
      <FormField label="Name" htmlFor="field-name">
        <Input
          id="field-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </FormField>
      <FormField label="Beschreibung" htmlFor="field-description">
        <Textarea
          id="field-description"
          value={description}
          rows={2}
          onChange={(e) => {
            setDescription(e.target.value);
            save({ description: e.target.value || null });
          }}
        />
      </FormField>
      <FormField label="Typ">
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
      </FormField>
      {isDossier ? (
        <DossierFieldSelector
          model={model}
          fieldId={field.id}
          selectedIds={dossierFieldIds}
          onChange={(ids) => {
            setDossierFieldIds(ids);
            save({ dossier_field_ids: ids.length > 0 ? ids : null });
          }}
        />
      ) : (
        <>
          <FormField
            label="AI Prompt"
            htmlFor="field-ai-prompt"
            actions={
              <div className="flex gap-1.5">
                <AiButton
                  onClick={() => setModalMode("generate_field_prompt")}
                  disabled={!processDescription}
                  title={!processDescription ? "Prozessbeschreibung erforderlich" : undefined}
                >
                  Generieren
                </AiButton>
                <AiButton
                  onClick={() => setModalMode("optimize_field_prompt")}
                  disabled={!processDescription || !hasPrompt}
                  title={!hasPrompt ? "Erst einen Prompt erstellen" : !processDescription ? "Prozessbeschreibung erforderlich" : undefined}
                >
                  Optimieren
                </AiButton>
              </div>
            }
          >
            <PromptField
              id="field-ai-prompt"
              variant="execution"
              value={aiPrompt}
              rows={4}
              placeholder="Anweisungen für die KI-Generierung..."
              onChange={(e) => {
                setAiPrompt(e.target.value);
                save({ ai_prompt: e.target.value || null });
              }}
            />
          </FormField>

          {/* Dependencies */}
          <FormField label="Abhängigkeiten">

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
          </FormField>
        </>
      )}

      {modalMode && (
        <GenerateDescriptionModal
          open={!!modalMode}
          onOpenChange={(open) => { if (!open) setModalMode(null); }}
          mode={modalMode}
          context={
            modalMode === "optimize_field_prompt"
              ? {
                  current_description: aiPrompt,
                  field_name: name,
                  field_description: description,
                  step_name: parentStep?.name ?? "",
                  stage_name: parentStage?.name ?? "",
                  process_description: processDescription,
                }
              : {
                  field_name: name,
                  field_description: description,
                  step_name: parentStep?.name ?? "",
                  step_description: parentStep?.description ?? "",
                  stage_name: parentStage?.name ?? "",
                  stage_description: parentStage?.description ?? "",
                  process_description: processDescription,
                }
          }
          title={modalMode === "optimize_field_prompt" ? "AI Prompt optimieren" : "AI Prompt generieren"}
          onApply={(text) => {
            setAiPrompt(text);
            save({ ai_prompt: text || null });
          }}
        />
      )}
    </div>
  );
}

// =============================================
// Dossier Reference Field Selector
// =============================================

function DossierFieldSelector({
  model,
  fieldId,
  selectedIds,
  onChange,
}: {
  model: FullProcessWithStages | null;
  fieldId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  if (!model) return null;

  const renderableTypes = new Set(["text", "long_text", "task_list", "task"]);

  const toggleField = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  return (
    <FormField label="Referenzfelder">
      <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-md border border-border/50 bg-secondary/30 p-3 [scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
        {model.stages.map((stage) => (
          <div key={stage.id}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {stage.name}
            </p>
            {stage.steps.map((step) => {
              const fields = step.fields?.filter(
                (f) => f.id !== fieldId && renderableTypes.has(f.type)
              );
              if (!fields?.length) return null;
              return (
                <div key={step.id} className="mb-2 ml-2">
                  <p className="mb-0.5 text-[10px] text-muted-foreground">{step.name}</p>
                  <div className="space-y-1 ml-2">
                    {fields.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 cursor-pointer text-xs">
                        <Checkbox
                          checked={selectedIds.includes(f.id)}
                          onCheckedChange={() => toggleField(f.id)}
                        />
                        <span>{f.name}</span>
                        <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[9px] font-normal">
                          {f.type === "task_list" ? "Task Liste" : f.type}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </FormField>
  );
}
