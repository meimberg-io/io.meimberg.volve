"use client";

import { useState, useCallback } from "react";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PromptField } from "@/components/field/PromptField";
import { FormField } from "@/components/ui/form-actions";

interface GenerateDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "process_description" | "optimize_description" | "describe_stage" | "describe_step" | "generate_field_prompt" | "optimize_field_prompt";
  context: Record<string, string>;
  title: string;
  onApply: (description: string) => void;
}

export function GenerateDescriptionModal({
  open,
  onOpenChange,
  mode,
  context,
  title,
  onApply,
}: GenerateDescriptionModalProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai/process-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          context,
          userPrompt: userPrompt || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResult(text);
      }
    } catch {
      setResult("Fehler bei der Generierung. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [mode, context, userPrompt]);

  const handleApply = () => {
    onApply(result);
    onOpenChange(false);
    setResult("");
    setUserPrompt("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setResult("");
    setUserPrompt("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "generate_field_prompt" || mode === "optimize_field_prompt"
              ? "KI-gestützten Prompt generieren"
              : "KI-gestützte Beschreibung generieren"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-0 flex-1 overflow-y-auto">
          {mode === "process_description" ? (
            <FormField label="Beschreibe den Prozess">
              <PromptField
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={3}
                placeholder="z.B. Ein Prozess für die Gründung eines SaaS-Unternehmens..."
                autoFocus
              />
            </FormField>
          ) : mode === "optimize_description" || mode === "optimize_field_prompt" ? (
            <>
              {context.current_description && (
                <FormField label={mode === "optimize_field_prompt" ? "Aktueller Prompt" : "Aktuelle Beschreibung"}>
                  <div className="max-h-[150px] overflow-y-auto rounded-md bg-muted/50 p-2.5">
                    <div className="prose prose-sm prose-invert max-w-none text-xs whitespace-pre-wrap">
                      {context.current_description}
                    </div>
                  </div>
                </FormField>
              )}
              <FormField label="Was soll geändert werden?">
                <PromptField
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={2}
                  placeholder={mode === "optimize_field_prompt"
                    ? "z.B. Detaillierter, mehr Kontext einbeziehen..."
                    : "z.B. Wir brauchen noch eine Zielgruppenanalyse..."
                  }
                  autoFocus
                />
              </FormField>
            </>
          ) : (
            <>
              {context.process_description && (
                <FormField label="Prozessbeschreibung (Kontext)">
                  <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground max-h-20 overflow-y-auto">
                    {context.process_description}
                  </div>
                </FormField>
              )}
              <FormField label="Zusatzhinweis (optional)">
                <PromptField
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={2}
                  placeholder="Optionale Ergänzungen für die Generierung..."
                />
              </FormField>
            </>
          )}

          {result && (
            <FormField label="Ergebnis">
              <div className="max-h-[250px] overflow-y-auto rounded-md border border-border bg-background p-3">
                {mode === "generate_field_prompt" || mode === "optimize_field_prompt" ? (
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">{result}</div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-xs">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                )}
              </div>
            </FormField>
          )}
        </div>

        {/* Footer: actions left, AI button right */}
        <div className="flex items-center justify-between shrink-0 pt-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1.5 text-xs cursor-pointer bg-red-500/80 text-white hover:bg-red-500"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
              Abbrechen
            </Button>
            {result && !loading && (
              <Button
                size="sm"
                className="gap-1.5 text-xs cursor-pointer bg-green-500/80 text-white hover:bg-green-500"
                onClick={handleApply}
              >
                <Check className="h-3 w-3" />
                Übernehmen
              </Button>
            )}
          </div>
          <Button
            size="sm"
            disabled={loading || ((mode === "process_description" || mode === "optimize_description" || mode === "optimize_field_prompt") && !userPrompt.trim())}
            onClick={handleGenerate}
            className="gap-1.5 text-xs cursor-pointer bg-amber-400 text-black border-amber-400 hover:bg-amber-500 hover:border-amber-500"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Generieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
