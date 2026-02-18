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
import { MarkdownField } from "@/components/field/MarkdownField";
import { FormField, CancelButton, SaveButton } from "@/components/ui/form-actions";

interface SnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialName?: string;
  initialShortDescription?: string;
  initialContent?: string;
  onSubmit: (values: {
    name: string;
    shortDescription: string;
    content: string;
  }) => Promise<void>;
}

export function SnippetDialog({
  open,
  onOpenChange,
  title,
  initialName = "",
  initialShortDescription = "",
  initialContent = "",
  onSubmit,
}: SnippetDialogProps) {
  const [name, setName] = useState(initialName);
  const [shortDescription, setShortDescription] = useState(initialShortDescription);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setShortDescription(initialShortDescription);
    setContent(initialContent);
  }, [open, initialName, initialShortDescription, initialContent]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        content,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Snippet-Inhalt erstellen oder bearbeiten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-0 flex-1 overflow-y-auto">
          <FormField label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Security-Anforderungen"
              autoFocus
            />
          </FormField>
          <FormField label="Kurzbeschreibung">
            <Textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Optional"
              className="min-h-[80px]"
            />
          </FormField>
          <FormField label="Content (Markdown)">
            <MarkdownField
              content={content}
              onChange={setContent}
              placeholder="# Titel"
              maxHeight="420px"
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
