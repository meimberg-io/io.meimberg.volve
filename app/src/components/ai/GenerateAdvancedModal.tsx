"use client";

import { useState } from "react";
import { Loader2, ZapOff, Lock, Unlock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-actions";

interface GenerateAdvancedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldId: string;
  processId: string;
  defaultPrompt: string;
  onResult: (content: string) => void;
}

const QUICK_INSTRUCTIONS = [
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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
              <ZapOff className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-base">Erweiterte Generierung</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Passe den Prompt an oder gib Zusatzanweisungen.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Standard Prompt */}
          <FormField
            label="Standard-Prompt"
            actions={
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-muted-foreground"
                onClick={() => setPromptEditable(!promptEditable)}
              >
                {promptEditable ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {promptEditable ? "Sperren" : "Bearbeiten"}
              </Button>
            }
          >
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!promptEditable}
              className="min-h-[100px] text-sm resize-none"
            />
          </FormField>

          {/* Additional Instructions */}
          <FormField label="Zusatzanweisungen">
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="z. B. 'Schwerpunkt auf Internationalität', 'Bitte kurz halten'"
              className="min-h-[80px] text-sm resize-none"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_INSTRUCTIONS.map((instr) => (
                <button
                  key={instr}
                  className="rounded-md border border-border/50 bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30 transition-colors cursor-pointer"
                  onClick={() => setInstructions(instr)}
                >
                  {instr}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Generieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
