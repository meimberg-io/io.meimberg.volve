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
import type {
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
  onRefresh: () => void;
  allFields: FieldTemplate[];
}

export function EditPanel({
  open,
  onOpenChange,
  editItem,
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
            <SheetTitle>
              {typeLabel} bearbeiten
            </SheetTitle>
            <SheetDescription>
              Eigenschaften des Templates anpassen
            </SheetDescription>
          </SheetHeader>

          {editItem && (
            <div className="mt-6 space-y-6 px-1">
              {editItem.type === "stage" && (
                <StageForm
                  stage={editItem.item as StageTemplate}
                  onRefresh={onRefresh}
                />
              )}
              {editItem.type === "step" && (
                <StepForm
                  step={editItem.item as StepTemplate}
                  onRefresh={onRefresh}
                />
              )}
              {editItem.type === "field" && (
                <FieldForm
                  field={editItem.item as FieldTemplate}
                  allFields={allFields}
                  onRefresh={onRefresh}
                />
              )}

              <Separator />

              {/* Instance count & delete */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Instanzen:</span>
                  <Badge variant="secondary">{instanceCount}</Badge>
                </div>

                {instanceCount > 0 && (
                  <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Dieses Template wird von {instanceCount} Instanz
                      {instanceCount !== 1 && "en"} verwendet und kann nicht
                      gelöscht werden.
                    </span>
                  </div>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={instanceCount > 0}
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
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
              onClick={() => setShowDeleteDialog(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
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
  onRefresh,
}: {
  stage: StageTemplate;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(stage.name);
  const [description, setDescription] = useState(stage.description ?? "");
  const [icon, setIcon] = useState(stage.icon ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setName(stage.name);
    setDescription(stage.description ?? "");
    setIcon(stage.icon ?? "");
  }, [stage.id, stage.name, stage.description, stage.icon]);

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stage-name">Name</Label>
        <Input
          id="stage-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stage-description">Beschreibung</Label>
        <Textarea
          id="stage-description"
          value={description}
          rows={3}
          onChange={(e) => {
            setDescription(e.target.value);
            save({ description: e.target.value || null });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stage-icon">Icon</Label>
        <Input
          id="stage-icon"
          value={icon}
          placeholder="z.B. file-text"
          onChange={(e) => {
            setIcon(e.target.value);
            save({ icon: e.target.value || null });
          }}
        />
      </div>
    </div>
  );
}

// =============================================
// Step Form
// =============================================

function StepForm({
  step,
  onRefresh,
}: {
  step: StepTemplate;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(step.name);
  const [description, setDescription] = useState(step.description ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setName(step.name);
    setDescription(step.description ?? "");
  }, [step.id, step.name, step.description]);

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="step-name">Name</Label>
        <Input
          id="step-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="step-description">Beschreibung</Label>
        <Textarea
          id="step-description"
          value={description}
          rows={3}
          onChange={(e) => {
            setDescription(e.target.value);
            save({ description: e.target.value || null });
          }}
        />
      </div>
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setName(field.name);
    setDescription(field.description ?? "");
    setType(field.type);
    setAiPrompt(field.ai_prompt ?? "");
    setDependencies(field.dependencies ?? []);
  }, [
    field.id,
    field.name,
    field.description,
    field.type,
    field.ai_prompt,
    field.dependencies,
  ]);

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
      <div className="space-y-2">
        <Label htmlFor="field-name">Name</Label>
        <Input
          id="field-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            save({ name: e.target.value });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="field-description">Beschreibung</Label>
        <Textarea
          id="field-description"
          value={description}
          rows={2}
          onChange={(e) => {
            setDescription(e.target.value);
            save({ description: e.target.value || null });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Typ</Label>
        <Select
          value={type}
          onValueChange={(value: FieldType) => {
            setType(value);
            save({ type: value });
          }}
        >
          <SelectTrigger>
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
      <div className="space-y-2">
        <Label htmlFor="field-ai-prompt">AI Prompt</Label>
        <Textarea
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
      <div className="space-y-2">
        <Label>Abhängigkeiten</Label>

        {/* Selected dependencies */}
        {dependencies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dependencies.map((depId) => {
              const depField = allFields.find((f) => f.id === depId);
              return (
                <Badge
                  key={depId}
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5"
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
            <SelectTrigger>
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
