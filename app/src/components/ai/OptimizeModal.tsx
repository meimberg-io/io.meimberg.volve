"use client";

import { useState } from "react";
import { Loader2, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-actions";
import { PromptField } from "@/components/field/PromptField";
import { cn } from "@/lib/utils";

interface OptimizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldId: string;
  processId: string;
  currentContent: string;
  onResult: (content: string) => void;
}

const QUICK_ACTIONS = [
  "Kürzer fassen",
  "Formeller formulieren",
  "Mit konkreten Zahlen ergänzen",
  "Einfacher formulieren",
  "Als Bullet Points",
  "Mehr Details",
];

export function OptimizeModal({
  open,
  onOpenChange,
  fieldId,
  processId,
  currentContent,
  onResult,
}: OptimizeModalProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    if (!instruction.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: fieldId,
          process_id: processId,
          optimize: true,
          optimize_instruction: instruction,
        }),
      });

      if (!response.ok) throw new Error("Optimierung fehlgeschlagen");

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
      console.error("Optimize error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
              <Wrench className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-base">Inhalt optimieren</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gib an, wie der Inhalt verbessert werden soll.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Current Content Preview */}
          <FormField label="Aktueller Inhalt">
            <div className="max-h-[160px] overflow-y-auto rounded-lg border border-border/50 bg-secondary/30 p-3">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {currentContent.length > 800
                  ? currentContent.slice(0, 800) + "..."
                  : currentContent}
              </div>
            </div>
          </FormField>

          {/* Quick Actions */}
          <FormField label="Schnellaktionen">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors cursor-pointer",
                    instruction === action
                      ? "border-blue-500/40 bg-blue-500/15 text-blue-400"
                      : "border-border/50 bg-secondary/40 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30"
                  )}
                  onClick={() => setInstruction(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </FormField>

          {/* Instruction */}
          <FormField label="Optimierungsanweisung">
            <PromptField
              variant="execution"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="z. B. 'Fasse kürzer zusammen', 'Ergänze quantitative Daten'"
              rows={3}
              autoFocus
            />
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
            onClick={handleOptimize}
            disabled={!instruction.trim() || loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Optimieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
