"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AiButton } from "@/components/ui/ai-button";
import { MarkdownField } from "@/components/field/MarkdownField";
import { PromptField } from "@/components/field/PromptField";

interface ProcessDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  onSave: (description: string) => void;
}

export function ProcessDescriptionModal({
  open,
  onOpenChange,
  description,
  onSave,
}: ProcessDescriptionModalProps) {
  const [localDesc, setLocalDesc] = useState(description);
  const [aiPrompt, setAiPrompt] = useState("");
  const [activeAi, setActiveAi] = useState<"generate" | "optimize" | null>(null);

  useEffect(() => {
    if (open) {
      setLocalDesc(description);
      setAiPrompt("");
    }
  }, [open, description]);

  const hasDescription = localDesc.trim().length > 0;

  const runAi = useCallback(
    async (aiMode: "process_description" | "optimize_description") => {
      setActiveAi(aiMode === "process_description" ? "generate" : "optimize");
      setLocalDesc("");

      const context =
        aiMode === "optimize_description"
          ? { current_description: localDesc }
          : {};

      try {
        const response = await fetch("/api/ai/template-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: aiMode,
            context,
            userPrompt: aiPrompt || undefined,
          }),
        });

        if (!response.ok) throw new Error("Generation failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let text = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setLocalDesc(text);
        }
      } catch {
        setLocalDesc("Fehler bei der Generierung. Bitte versuche es erneut.");
      } finally {
        setActiveAi(null);
      }
    },
    [localDesc, aiPrompt]
  );

  const handleSave = () => {
    onSave(localDesc);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const hasChanges = localDesc !== description;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prozessbeschreibung</DialogTitle>
          <DialogDescription>
            Beschreibung bearbeiten oder mit KI generieren
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-0 flex-1 overflow-y-auto">
          {/* Markdown Editor */}
          <MarkdownField
            content={localDesc}
            onChange={setLocalDesc}
            placeholder="Beschreibung des Prozessmodells..."
            disabled={!!activeAi}
            autoScroll={!!activeAi}
          />

          {/* AI prompt */}
          <PromptField
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
        </div>

        {/* Footer: AI buttons left, actions right */}
        <div className="flex items-center justify-between shrink-0 pt-2">
          <div className="flex gap-2">
            <AiButton
              loading={activeAi === "generate"}
              disabled={!!activeAi || !aiPrompt.trim()}
              onClick={() => runAi("process_description")}
            >
              Generieren
            </AiButton>
            <AiButton
              loading={activeAi === "optimize"}
              disabled={!!activeAi || !aiPrompt.trim() || !hasDescription}
              onClick={() => runAi("optimize_description")}
              title={!hasDescription ? "Erst eine Beschreibung erstellen" : undefined}
            >
              Optimieren
            </AiButton>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1.5 text-xs cursor-pointer bg-red-500/80 text-white hover:bg-red-500"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
              Verwerfen
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs cursor-pointer bg-green-500/80 text-white hover:bg-green-500"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Check className="h-3 w-3" />
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
