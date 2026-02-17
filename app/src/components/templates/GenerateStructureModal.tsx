"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, Check, X, ChevronRight, AlertTriangle } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  bulkCreateStages,
  bulkCreateStepsWithFields,
  clearStages,
  clearSteps,
} from "@/lib/data/templates";

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

interface GenerateStructureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "generate_stages" | "generate_steps";
  context: Record<string, string>;
  parentId: string;
  hasExisting: boolean;
  onComplete: () => void;
}

export function GenerateStructureModal({
  open,
  onOpenChange,
  mode,
  context,
  parentId,
  hasExisting,
  onComplete,
}: GenerateStructureModalProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [stages, setStages] = useState<GeneratedStage[] | null>(null);
  const [steps, setSteps] = useState<GeneratedStep[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasResults = mode === "generate_stages" ? stages !== null : steps !== null;

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStages(null);
    setSteps(null);

    try {
      const response = await fetch("/api/ai/template-generate", {
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

      const data = await response.json();

      if (mode === "generate_stages") {
        setStages(data.stages ?? []);
      } else {
        setSteps(data.steps ?? []);
      }
    } catch {
      setError("Fehler bei der Generierung. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [mode, context, userPrompt]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setStages(null);
    setSteps(null);
    setUserPrompt("");
    setReplaceExisting(false);
    setError(null);
  }, [onOpenChange]);

  const handleApply = useCallback(async () => {
    setApplying(true);
    try {
      if (mode === "generate_stages" && stages) {
        if (replaceExisting) {
          await clearStages(parentId);
        }
        const startIndex = replaceExisting ? 0 : undefined;
        if (!replaceExisting) {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: existing } = await supabase
            .from("stage_templates")
            .select("order_index")
            .eq("model_id", parentId)
            .order("order_index", { ascending: false })
            .limit(1);
          const offset = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
          await bulkCreateStages(parentId, stages, offset);
        } else {
          await bulkCreateStages(parentId, stages, startIndex ?? 0);
        }
      } else if (mode === "generate_steps" && steps) {
        if (replaceExisting) {
          await clearSteps(parentId);
        }
        if (!replaceExisting) {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: existing } = await supabase
            .from("step_templates")
            .select("order_index")
            .eq("stage_template_id", parentId)
            .order("order_index", { ascending: false })
            .limit(1);
          const offset = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
          await bulkCreateStepsWithFields(parentId, steps, offset);
        } else {
          await bulkCreateStepsWithFields(parentId, steps, 0);
        }
      }
      onComplete();
      handleClose();
    } catch {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setApplying(false);
    }
  }, [mode, stages, steps, parentId, replaceExisting, onComplete, handleClose]);

  const title =
    mode === "generate_stages"
      ? "Stages generieren"
      : "Steps & Fields generieren";

  const totalFields = steps?.reduce((sum, s) => sum + s.fields.length, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {mode === "generate_stages"
              ? "KI generiert Stages basierend auf der Prozessbeschreibung"
              : "KI generiert Steps mit Fields basierend auf der Stage-Beschreibung"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-0 overflow-y-auto">
          {context.process_description && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Prozessbeschreibung</Label>
              <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground max-h-16 overflow-y-auto">
                {context.process_description}
              </div>
            </div>
          )}

          {context.stage_description && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Stage-Beschreibung</Label>
              <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground max-h-16 overflow-y-auto">
                {context.stage_description}
              </div>
            </div>
          )}

          {!hasResults && (
            <div className="space-y-2">
              <Label>Zusatzhinweis (optional)</Label>
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={2}
                placeholder="Optionale Ergänzungen für die Generierung..."
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Generiere...</span>
            </div>
          )}

          {/* Stages preview */}
          {stages && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Vorschau: {stages.length} Stages
              </Label>
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
                        <p className="text-sm font-medium">{stage.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Steps + Fields preview */}
          {steps && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Vorschau: {steps.length} Steps, {totalFields} Fields
              </Label>
              <ScrollArea className="max-h-[280px]">
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-500">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <p className="text-sm font-medium">{step.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-7">
                        {step.description}
                      </p>
                      {step.fields.length > 0 && (
                        <div className="mt-2 ml-7 space-y-1">
                          {step.fields.map((field, j) => (
                            <div
                              key={j}
                              className="flex items-center gap-2 text-xs"
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
            </div>
          )}

          {hasResults && hasExisting && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="replace"
                checked={replaceExisting}
                onCheckedChange={(checked) =>
                  setReplaceExisting(checked === true)
                }
              />
              <label
                htmlFor="replace"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                Bestehende{" "}
                {mode === "generate_stages" ? "Stages" : "Steps"}{" "}
                ersetzen (sonst werden neue angehängt)
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 shrink-0">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-1.5 h-4 w-4" />
            Abbrechen
          </Button>
          {hasResults ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStages(null);
                  setSteps(null);
                }}
              >
                Neu generieren
              </Button>
              <Button onClick={handleApply} disabled={applying}>
                {applying ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-4 w-4" />
                )}
                {applying ? "Speichere..." : "Übernehmen"}
              </Button>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              {loading ? "Generiere..." : "Generieren"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
