"use client";

import { useState, useCallback } from "react";
import { Loader2, Check, X, ChevronRight, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AiButton } from "@/components/ui/ai-button";
import { PromptField } from "@/components/field/PromptField";
import { FormField } from "@/components/ui/form-actions";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  bulkCreateStages,
  bulkCreateStepsWithFields,
  clearStages,
  clearSteps,
} from "@/lib/data/processes";

interface GeneratedStage {
  name: string;
  description: string;
}

interface GeneratedField {
  name: string;
  type: string;
  description: string;
  ai_prompt: string;
}

interface GeneratedStep {
  name: string;
  description: string;
  fields: GeneratedField[];
}

interface ExistingItem {
  name: string;
  description: string;
}

interface GenerateStructureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "generate_stages" | "generate_steps";
  context: Record<string, string>;
  parentId: string;
  hasExisting: boolean;
  existingItems?: ExistingItem[];
  onComplete: () => void;
}

export function GenerateStructureModal({
  open,
  onOpenChange,
  mode,
  context,
  parentId,
  hasExisting,
  existingItems = [],
  onComplete,
}: GenerateStructureModalProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [stages, setStages] = useState<GeneratedStage[] | null>(null);
  const [steps, setSteps] = useState<GeneratedStep[] | null>(null);
  const [activeAi, setActiveAi] = useState<"generate" | "extend" | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyMode, setApplyMode] = useState<"replace" | "append">("replace");
  const [error, setError] = useState<string | null>(null);

  const hasResults = mode === "generate_stages" ? stages !== null : steps !== null;
  const itemLabel = mode === "generate_stages" ? "Stages" : "Steps";

  const handleGenerate = useCallback(async (aiMode: "generate" | "extend") => {
    setActiveAi(aiMode);
    setError(null);
    setStages(null);
    setSteps(null);
    setApplyMode(aiMode === "generate" ? "replace" : "append");

    const apiMode = aiMode === "extend"
      ? (mode === "generate_stages" ? "extend_stages" : "extend_steps")
      : mode;

    const extendContext = aiMode === "extend"
      ? {
          ...context,
          existing_items: existingItems
            .map((item) => `- "${item.name}": ${item.description || "(keine Beschreibung)"}`)
            .join("\n"),
        }
      : context;

    try {
      const response = await fetch("/api/ai/process-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: apiMode,
          context: extendContext,
          userPrompt: userPrompt || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const data = await response.json();

      if (mode === "generate_stages") {
        setStages(data.stages ?? []);
      } else {
        setSteps(data.steps ?? []);
      }
    } catch {
      setError("Fehler bei der Generierung. Bitte versuche es erneut.");
    } finally {
      setActiveAi(null);
    }
  }, [mode, context, existingItems, userPrompt]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setStages(null);
    setSteps(null);
    setUserPrompt("");
    setApplyMode("replace");
    setError(null);
  }, [onOpenChange]);

  const handleApply = useCallback(async () => {
    setApplying(true);
    try {
      if (mode === "generate_stages" && stages) {
        if (applyMode === "replace") {
          await clearStages(parentId);
          await bulkCreateStages(parentId, stages, 0);
        } else {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: existing } = await supabase
            .from("stages")
            .select("order_index")
            .eq("process_id", parentId)
            .order("order_index", { ascending: false })
            .limit(1);
          const offset = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
          await bulkCreateStages(parentId, stages, offset);
        }
      } else if (mode === "generate_steps" && steps) {
        if (applyMode === "replace") {
          await clearSteps(parentId);
          await bulkCreateStepsWithFields(parentId, steps, 0);
        } else {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: existing } = await supabase
            .from("steps")
            .select("order_index")
            .eq("stage_id", parentId)
            .order("order_index", { ascending: false })
            .limit(1);
          const offset = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
          await bulkCreateStepsWithFields(parentId, steps, offset);
        }
      }
      onComplete();
      handleClose();
    } catch {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setApplying(false);
    }
  }, [mode, stages, steps, parentId, applyMode, onComplete, handleClose]);

  const title =
    mode === "generate_stages"
      ? "Stages generieren"
      : "Steps & Fields generieren";

  const totalFields = steps?.reduce((sum, s) => sum + s.fields.length, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "generate_stages"
              ? "KI generiert Stages basierend auf der Prozessbeschreibung"
              : "KI generiert Steps mit Fields basierend auf der Stage-Beschreibung"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-0 flex-1 overflow-y-auto">
          {context.process_description && (
            <FormField label="Prozessbeschreibung">
              <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground max-h-16 overflow-y-auto">
                {context.process_description}
              </div>
            </FormField>
          )}

          {context.stage_description && (
            <FormField label="Stage-Beschreibung">
              <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground max-h-16 overflow-y-auto">
                {context.stage_description}
              </div>
            </FormField>
          )}

          <FormField label={`Prompt ${!hasResults && hasExisting ? "(für Ergänzen erforderlich)" : "(optional)"}`}>
            <PromptField
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={2}
              placeholder={hasExisting
                ? `z.B. Ergänze ${itemLabel} für ...`
                : "Optionale Ergänzungen für die Generierung..."
              }
            />
          </FormField>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {error}
            </div>
          )}

          {!!activeAi && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Generiere...</span>
            </div>
          )}

          {/* Stages preview */}
          {stages && (
            <FormField label={`Vorschau: ${stages.length} Stages${applyMode === "append" ? " (werden ergänzt)" : ""}`}>
              <ScrollArea className="max-h-[280px]">
                <div className="space-y-2">
                  {stages.map((stage, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border border-border p-2.5"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{stage.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </FormField>
          )}

          {/* Steps + Fields preview */}
          {steps && (
            <FormField label={`Vorschau: ${steps.length} Steps, ${totalFields} Fields${applyMode === "append" ? " (werden ergänzt)" : ""}`}>
              <ScrollArea className="max-h-[280px]">
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-500">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <p className="text-xs font-medium">{step.name}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 ml-7">
                        {step.description}
                      </p>
                      {step.fields.length > 0 && (
                        <div className="mt-2 ml-7 space-y-1">
                          {step.fields.map((field, j) => (
                            <div
                              key={j}
                              className="flex items-center gap-2 text-[11px]"
                            >
                              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                              <span className="text-foreground/80">{field.name}</span>
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0"
                              >
                                {field.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </FormField>
          )}
        </div>

        {/* Footer */}
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
            {hasResults && (
              <Button
                size="sm"
                className="gap-1.5 text-xs cursor-pointer bg-green-500/80 text-white hover:bg-green-500"
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                {applying ? "Speichere..." : "Übernehmen"}
              </Button>
            )}
          </div>
          {!hasResults && (
            <div className="flex gap-2">
              <AiButton
                loading={activeAi === "generate"}
                disabled={!!activeAi}
                onClick={() => handleGenerate("generate")}
              >
                Neu generieren
              </AiButton>
              {hasExisting && (
                <AiButton
                  loading={activeAi === "extend"}
                  disabled={!!activeAi || !userPrompt.trim()}
                  onClick={() => handleGenerate("extend")}
                  title={!userPrompt.trim() ? "Prompt erforderlich zum Ergänzen" : undefined}
                >
                  Ergänzen
                </AiButton>
              )}
            </div>
          )}
          {hasResults && (
            <AiButton
              onClick={() => handleGenerate(applyMode === "append" ? "extend" : "generate")}
            >
              Nochmal
            </AiButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
