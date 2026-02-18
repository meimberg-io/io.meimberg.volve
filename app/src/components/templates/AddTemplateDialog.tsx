"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTemplate, createStage, createStep, createField } from "@/lib/data/templates";
import type { FieldType } from "@/types";

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: {
    type: "model" | "stage" | "step" | "field";
    parentId?: string;
  } | null;
  onCreated: () => void;
}

const typeLabels: Record<string, string> = {
  model: "Prozessmodell",
  stage: "Stage",
  step: "Step",
  field: "Field",
};

export function AddTemplateDialog({
  open,
  onOpenChange,
  context,
  onCreated,
}: AddTemplateDialogProps) {
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("long_text");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setFieldType("long_text");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim() || !context) return;
    setSubmitting(true);
    try {
      switch (context.type) {
        case "model":
          await createTemplate(name.trim());
          break;
        case "stage":
          if (context.parentId)
            await createStage(context.parentId, name.trim());
          break;
        case "step":
          if (context.parentId)
            await createStep(context.parentId, name.trim());
          break;
        case "field":
          if (context.parentId)
            await createField(
              context.parentId,
              name.trim(),
              fieldType
            );
          break;
      }
      onOpenChange(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm">
            {context ? typeLabels[context.type] : "Element"} erstellen
          </DialogTitle>
          <DialogDescription className="text-xs">
            Gib einen Namen für das neue Template ein.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="add-name" className="text-xs">Name</Label>
            <Input
              ref={inputRef}
              id="add-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Name des ${context ? typeLabels[context.type] : "Elements"}...`}
              className="text-xs!"
            />
          </div>

          {context?.type === "field" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Typ</Label>
              <Select
                value={fieldType}
                onValueChange={(v: FieldType) => setFieldType(v)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="long_text">Long Text</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="file_list">File List</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            size="sm"
            className="gap-1.5 text-xs cursor-pointer bg-red-500/80 text-white hover:bg-red-500"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3 w-3" />
            Abbrechen
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs cursor-pointer bg-green-500/80 text-white hover:bg-green-500"
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
          >
            <Check className="h-3 w-3" />
            {submitting ? "Erstelle..." : "Erstellen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
