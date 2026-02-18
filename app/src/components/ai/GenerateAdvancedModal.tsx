"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface GenerateAdvancedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldId: string;
  processId: string;
  defaultPrompt: string;
  onResult: (content: string) => void;
}

const RECENT_INSTRUCTIONS = [
  "Fokus auf DACH-Markt",
  "Bitte kurz halten",
  "Mit konkreten Zahlen",
  "Mehr Details",
  "Professioneller Ton",
];

export function GenerateAdvancedModal({
  open,
  onOpenChange,
  fieldId,
  processId,
  defaultPrompt,
  onResult,
}: GenerateAdvancedModalProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [instructions, setInstructions] = useState("");
  const [promptEditable, setPromptEditable] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: fieldId,
          process_id: processId,
          custom_prompt: promptEditable ? prompt : undefined,
          additional_instructions: instructions || undefined,
        }),
      });

      if (!response.ok) throw new Error("Generation fehlgeschlagen");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
        }
      }

      onResult(accumulated);
      onOpenChange(false);
    } catch (error) {
      console.error("Generate Advanced error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Erweiterte Generierung</DialogTitle>
          <DialogDescription>
            Passe den Prompt an oder gib Zusatzanweisungen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-2">
          {/* Standard Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Standard-Prompt</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPromptEditable(!promptEditable)}
              >
                {promptEditable ? "Sperren" : "Bearbeiten"}
              </Button>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!promptEditable}
              className="min-h-[100px] text-sm resize-none"
            />
          </div>

          {/* Additional Instructions */}
          <div className="space-y-2">
            <Label>Zusatzanweisungen</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="z. B. 'Schwerpunkt auf Internationalität', 'Bitte kurz halten'"
              className="min-h-[80px] text-sm resize-none"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {RECENT_INSTRUCTIONS.map((instr) => (
                <Badge
                  key={instr}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20"
                  onClick={() => setInstructions(instr)}
                >
                  {instr}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
