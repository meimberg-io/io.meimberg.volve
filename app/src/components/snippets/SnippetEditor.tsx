"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownField } from "@/components/field/MarkdownField";
import { FormField, SaveButton } from "@/components/ui/form-actions";
import type { Snippet } from "@/types";

interface SnippetEditorProps {
  snippet: Snippet | null;
  onSave: (values: {
    name: string;
    shortDescription: string;
    content: string;
  }) => Promise<void>;
}

export function SnippetEditor({ snippet, onSave }: SnippetEditorProps) {
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(snippet?.name ?? "");
    setShortDescription(snippet?.short_description ?? "");
    setContent(snippet?.content ?? "");
  }, [snippet?.id, snippet?.name, snippet?.short_description, snippet?.content]);

  if (!snippet) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <h3 className="text-sm font-medium">Kein Snippet ausgewählt</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Wähle links ein Snippet aus oder erstelle ein neues.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        content,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Snippet bearbeiten</h2>
        <SaveButton onClick={handleSave} disabled={!name.trim() || saving} loading={saving} />
      </div>

      <div className="space-y-4">
        <FormField label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>

        <FormField label="Kurzbeschreibung">
          <Textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="min-h-[90px]"
          />
        </FormField>

        <FormField label="Content (Markdown)">
          <MarkdownField
            content={content}
            onChange={setContent}
            placeholder="Markdown-Inhalt für dieses Snippet..."
            maxHeight="520px"
          />
        </FormField>
      </div>
    </div>
  );
}
