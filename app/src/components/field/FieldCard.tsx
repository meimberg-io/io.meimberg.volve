"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Zap,
  ZapOff,
  Wrench,
  Check,
  Pencil,
  Loader2,
  History,
  MinusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MarkdownEditor } from "./MarkdownEditor";
import { GenerateAdvancedModal } from "@/components/ai/GenerateAdvancedModal";
import { OptimizeModal } from "@/components/ai/OptimizeModal";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { DependencyHint } from "./DependencyHint";
import type { Field } from "@/types";

interface FieldCardProps {
  field: Field;
  processId: string;
  onUpdate: () => void;
}

export function FieldCard({ field, processId, onUpdate }: FieldCardProps) {
  const fieldType = field.type ?? "long_text";
  const isTask = fieldType === "task";
  const isClosed = field.status === "closed";
  const isSkipped = field.status === "skipped";
  const isDone = isClosed || isSkipped;
  const isEmpty = field.status === "empty" || !field.content?.trim();
  const dependencies: string[] = field.dependencies ?? [];

  const [content, setContent] = useState(field.content ?? "");
  const [saving, setSaving] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showOptimize, setShowOptimize] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const previousContent = useRef<string>(field.content ?? "");

  // Sync state when field prop changes
  useEffect(() => {
    setContent(field.content ?? "");
    previousContent.current = field.content ?? "";
  }, [field.content]);

  // Autosave with 2s debounce
  const autosave = useCallback(
    (value: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        if (value === previousContent.current) return;
        setSaving(true);
        try {
          const supabase = createClient();
          const newStatus = value.trim() ? "open" : "empty";
          await supabase
            .from("fields")
            .update({ content: value, status: newStatus })
            .eq("id", field.id);

          // Save version
          if (value.trim()) {
            await supabase.from("field_versions").insert({
              field_id: field.id,
              content: value,
              source: "manual",
            });
          }

          previousContent.current = value;
        } finally {
          setSaving(false);
        }
      }, 2000);
    },
    [field.id]
  );

  const handleContentChange = (value: string) => {
    setContent(value);
    autosave(value);
  };

  // Generate (one-click)
  const handleGenerate = async () => {
    if (!isEmpty && !confirm("Vorhandener Inhalt wird ersetzt. Fortfahren?")) return;

    setStreaming(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: field.id,
          process_id: processId,
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
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setContent(accumulated);
        }
      }

      // Save the generated content
      const supabase = createClient();
      await supabase
        .from("fields")
        .update({ content: accumulated, status: "open" })
        .eq("id", field.id);

      await supabase.from("field_versions").insert({
        field_id: field.id,
        content: accumulated,
        source: "generate",
      });

      previousContent.current = accumulated;
      onUpdate();
    } catch (error) {
      console.error("Generate error:", error);
    } finally {
      setStreaming(false);
    }
  };

  // Close field with status cascade
  const handleClose = async () => {
    if (!content.trim()) return;
    const supabase = createClient();
    await supabase
      .from("fields")
      .update({ status: "closed" })
      .eq("id", field.id);

    // Trigger status cascade recalculation
    await recalculateStatus(field.id);
    onUpdate();

    // Auto-scroll to next open field
    setTimeout(() => {
      const allFieldCards = document.querySelectorAll("[id^='field-']");
      let foundCurrent = false;
      for (const card of allFieldCards) {
        if (card.id === `field-${field.id}`) {
          foundCurrent = true;
          continue;
        }
        if (foundCurrent && card.querySelector(".field-card-open, .field-card-empty")) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }, 100);
  };

  // Reopen field with reverse cascade
  const handleReopen = async () => {
    const supabase = createClient();
    const newStatus = content.trim() ? "open" : "empty";
    await supabase
      .from("fields")
      .update({ status: newStatus })
      .eq("id", field.id);

    await recalculateStatus(field.id);
    onUpdate();
  };

  // Skip field (mark as not relevant)
  const handleSkip = async () => {
    const supabase = createClient();
    await supabase
      .from("fields")
      .update({ status: "skipped" })
      .eq("id", field.id);

    await recalculateStatus(field.id);
    onUpdate();

    setTimeout(() => {
      const allFieldCards = document.querySelectorAll("[id^='field-']");
      let foundCurrent = false;
      for (const card of allFieldCards) {
        if (card.id === `field-${field.id}`) {
          foundCurrent = true;
          continue;
        }
        if (foundCurrent && card.querySelector(".field-card-open, .field-card-empty")) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }, 100);
  };

  // Recalculate status cascade
  const recalculateStatus = async (fieldInstanceId: string) => {
    try {
      const supabase = createClient();

      // Get field's step
      const { data: fieldData } = await supabase
        .from("fields")
        .select("step_id")
        .eq("id", fieldInstanceId)
        .single();
      if (!fieldData) return;

      // Check all fields in the step
      const { data: stepFields } = await supabase
        .from("fields")
        .select("status")
        .eq("step_id", fieldData.step_id);

      const allDone = stepFields?.every((f) => f.status === "closed" || f.status === "skipped") ?? false;
      const anyActive = stepFields?.some((f) => f.status !== "empty") ?? false;
      const stepStatus = allDone ? "completed" : anyActive ? "in_progress" : "open";

      await supabase
        .from("steps")
        .update({ status: stepStatus })
        .eq("id", fieldData.step_id);

      // Get step's stage
      const { data: stepData } = await supabase
        .from("steps")
        .select("stage_id")
        .eq("id", fieldData.step_id)
        .single();
      if (!stepData) return;

      // Check all steps in the stage
      const { data: stageSteps } = await supabase
        .from("steps")
        .select("status")
        .eq("stage_id", stepData.stage_id);

      const allStepsCompleted = stageSteps?.every((s) => s.status === "completed") ?? false;
      const anyStepActive = stageSteps?.some((s) => s.status !== "open") ?? false;
      const stageStatus = allStepsCompleted ? "completed" : anyStepActive ? "in_progress" : "open";
      const stageProgress = stageSteps
        ? (stageSteps.filter((s) => s.status === "completed").length / stageSteps.length) * 100
        : 0;

      await supabase
        .from("stages")
        .update({ status: stageStatus, progress: stageProgress })
        .eq("id", stepData.stage_id);

      // Get stage's process
      const { data: stageData } = await supabase
        .from("stages")
        .select("process_id")
        .eq("id", stepData.stage_id)
        .single();
      if (!stageData) return;

      // Check all stages
      const { data: processStages } = await supabase
        .from("stages")
        .select("status, progress")
        .eq("process_id", stageData.process_id);

      const allStagesCompleted = processStages?.every((s) => s.status === "completed") ?? false;
      const processProgress = processStages
        ? processStages.reduce((sum, s) => sum + (s.progress ?? 0), 0) / processStages.length
        : 0;

      await supabase
        .from("processes")
        .update({
          status: allStagesCompleted ? "completed" : "active",
          progress: processProgress,
        })
        .eq("id", stageData.process_id);
    } catch (e) {
      console.error("Status cascade error:", e);
    }
  };

  // Save after AI generation
  const handleAIResult = async (result: string, source: string) => {
    setContent(result);
    const supabase = createClient();
    await supabase
      .from("fields")
      .update({ content: result, status: "open" })
      .eq("id", field.id);

    await supabase.from("field_versions").insert({
      field_id: field.id,
      content: result,
      source,
    });

    previousContent.current = result;
    onUpdate();
  };

  return (
    <>
      <div
        className={cn(
          "field-card",
          isSkipped
            ? "field-card-skipped"
            : isClosed
              ? "field-card-closed"
              : streaming
                ? "field-card-streaming"
                : isEmpty
                  ? "field-card-empty"
                  : "field-card-open"
        )}
        id={`field-${field.id}`}
      >
        {/* Header */}
        <div
          className={cn(
            "-mx-4 -mt-4 mb-3 px-4 py-2.5 rounded-t-lg space-y-1.5",
            isSkipped
              ? "bg-muted/30"
              : isClosed
                ? "bg-emerald-500/8"
                : streaming
                  ? "bg-primary/8"
                  : isEmpty
                    ? "bg-muted/50"
                    : "bg-status-warning/8"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  isSkipped
                    ? "bg-muted-foreground/50"
                    : isClosed
                      ? "bg-emerald-500"
                      : streaming
                        ? "bg-primary animate-pulse"
                        : isEmpty
                          ? "bg-destructive/70"
                          : "bg-status-warning"
                )}
              />
              <h4 className={cn("text-sm font-medium", isSkipped && "text-muted-foreground line-through")}>{field.name ?? "Feld"}</h4>
              {isSkipped && (
                <span className="rounded bg-muted-foreground/15 px-1.5 py-0.5 text-xs text-muted-foreground">
                  Nicht relevant
                </span>
              )}
              {isTask && !isSkipped && (
                <span className="rounded bg-status-warning/20 px-1.5 py-0.5 text-xs text-status-warning">
                  Task
                </span>
              )}
              {saving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Speichern...
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
            {isDone ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleReopen}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Wieder öffnen</TooltipContent>
              </Tooltip>
            ) : (
              <>
                {/* Generate */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-400 hover:!bg-blue-400 hover:!text-black"
                      onClick={handleGenerate}
                      disabled={streaming || !field.ai_prompt}
                    >
                      {streaming ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generieren (Ctrl+G)</TooltipContent>
                </Tooltip>

                {/* Generate Advanced */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-400 hover:!bg-blue-400 hover:!text-black"
                      onClick={() => setShowAdvanced(true)}
                      disabled={streaming || !field.ai_prompt}
                    >
                      <ZapOff className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Erweitert generieren</TooltipContent>
                </Tooltip>

                {/* Optimize */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-400 hover:!bg-blue-400 hover:!text-black"
                      onClick={() => setShowOptimize(true)}
                      disabled={streaming || !content.trim()}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Optimieren</TooltipContent>
                </Tooltip>

                {/* Version History */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowHistory(true)}
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Versionshistorie</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
          </div>

          {/* Dependency Hint */}
          {dependencies.length > 0 && (
            <DependencyHint
              dependencyIds={dependencies}
              processId={processId}
            />
          )}
        </div>

        {/* Content Area */}
        {!isSkipped && (
          <div className="mt-2">
            {fieldType === "text" ? (
              <Input
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={isEmpty ? "Noch kein Inhalt -- nutze 'Generieren', um zu starten." : ""}
                disabled={isClosed}
                className={cn(
                  "bg-transparent border-none focus-visible:ring-0 px-0",
                  isClosed && "opacity-80"
                )}
                maxLength={500}
              />
            ) : isClosed ? (
              <MarkdownEditor
                content={content}
                onChange={() => {}}
                disabled={true}
              />
            ) : (
              <MarkdownEditor
                content={content}
                onChange={handleContentChange}
                placeholder={
                  isEmpty
                    ? "Noch kein Inhalt -- nutze 'Generieren', um zu starten."
                    : "Schreibe hier..."
                }
                disabled={isClosed}
                autoScroll={streaming}
              />
            )}
          </div>
        )}

        {/* Footer */}
        {!isDone && (
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="gap-1.5 text-xs text-muted-foreground hover:!bg-red-500/10 hover:!text-red-400"
            >
              <MinusCircle className="h-3.5 w-3.5" />
              Nicht relevant
            </Button>
            {content.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="gap-1.5 text-xs text-emerald-400 hover:!bg-emerald-500 hover:!text-black"
              >
                <Check className="h-3.5 w-3.5" />
                Abschließen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdvanced && (
        <GenerateAdvancedModal
          open={showAdvanced}
          onOpenChange={setShowAdvanced}
          fieldId={field.id}
          processId={processId}
          defaultPrompt={field.ai_prompt ?? ""}
          onResult={(result) => handleAIResult(result, "generate_advanced")}
        />
      )}

      {showOptimize && (
        <OptimizeModal
          open={showOptimize}
          onOpenChange={setShowOptimize}
          fieldId={field.id}
          processId={processId}
          currentContent={content}
          onResult={(result) => handleAIResult(result, "optimize")}
        />
      )}

      {showHistory && (
        <VersionHistoryPanel
          open={showHistory}
          onOpenChange={setShowHistory}
          fieldInstanceId={field.id}
          onRestore={(restoredContent) => {
            setContent(restoredContent);
            previousContent.current = restoredContent;
            onUpdate();
          }}
        />
      )}
    </>
  );
}
