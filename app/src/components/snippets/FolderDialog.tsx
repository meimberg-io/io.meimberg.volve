"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, CancelButton, SaveButton } from "@/components/ui/form-actions";

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialName?: string;
  initialDescription?: string;
  onSubmit: (values: { name: string; description: string }) => Promise<void>;
}

export function FolderDialog({
  open,
  onOpenChange,
  title,
  initialName = "",
  initialDescription = "",
  onSubmit,
}: FolderDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setDescription(initialDescription);
  }, [open, initialName, initialDescription]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Ordner-Metadaten bearbeiten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FormField label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Security"
              autoFocus
            />
          </FormField>
          <FormField label="Kurzbeschreibung">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="min-h-[90px]"
            />
          </FormField>
        </div>

        <DialogFooter className="pt-2">
          <CancelButton onClick={() => onOpenChange(false)} disabled={saving} />
          <SaveButton
            loading={saving}
            onClick={handleSave}
            disabled={!name.trim() || saving}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
