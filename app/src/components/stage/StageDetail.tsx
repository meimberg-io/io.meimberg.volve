"use client";

import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FieldCard } from "@/components/field/FieldCard";
import { TaskFieldCard } from "@/components/field/TaskFieldCard";
import { cn } from "@/lib/utils";
import type { StageWithSteps } from "@/types";

interface StageDetailProps {
  stage: StageWithSteps;
  processId: string;
  onFieldUpdate: () => void;
}

export function StageDetail({ stage, processId, onFieldUpdate }: StageDetailProps) {
  // Find first step with open/empty fields for default expanded
  const firstOpenStep = stage.steps.find(
    (s) => s.status !== "completed"
  );

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">{stage.name ?? "Stage"}</h1>
          <Badge
            variant="secondary"
            className={cn(
              stage.status === "completed"
                ? "bg-accent/20 text-accent"
                : stage.status === "in_progress"
                  ? "bg-primary/20 text-primary"
                  : ""
            )}
          >
            {stage.status === "completed"
              ? "Abgeschlossen"
              : stage.status === "in_progress"
                ? "In Bearbeitung"
                : "Offen"}
          </Badge>
        </div>
        {stage.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {stage.description}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Progress value={stage.progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {Math.round(stage.progress)}%
          </span>
        </div>
      </div>

      {/* Steps Accordion */}
      <Accordion
        type="multiple"
        defaultValue={firstOpenStep ? [firstOpenStep.id] : []}
        className="space-y-3"
      >
        {stage.steps.map((step, index) => {
          const totalFields = step.fields.length;
          const isCompleted = step.status === "completed";
          const stepLetter = String.fromCharCode(65 + index); // A, B, C, ...

          return (
            <AccordionItem
              key={step.id}
              value={step.id}
              className="rounded-xl border border-border/50 overflow-hidden"
            >
              <AccordionTrigger
                className={cn(
                  "px-5 py-3.5 hover:no-underline",
                  "bg-[oklch(0.22_0.025_260)] hover:bg-[oklch(0.24_0.025_260)]",
                  "data-[state=open]:border-b data-[state=open]:border-border/40"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  {/* Letter badge */}
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full shrink-0 text-sm font-bold",
                      isCompleted
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary/15 text-primary"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      stepLetter
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <span className="font-semibold">
                      {step.name ?? "Step"}
                    </span>
                    {step.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {step.description}
                      </p>
                    )}
                  </div>

                  {/* Field status dots */}
                  {!isCompleted && totalFields > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {step.fields.map((f) => (
                        <span
                          key={f.id}
                          className={cn(
                            "inline-block h-3 w-3 rounded-full",
                            f.status === "closed"
                              ? "bg-accent"
                              : f.status === "open"
                                ? "bg-status-warning"
                                : "bg-destructive/70"
                          )}
                          title={
                            f.status === "closed"
                              ? "Abgeschlossen"
                              : f.status === "open"
                                ? "In Bearbeitung"
                                : "Leer"
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="bg-card px-5 pb-5">
                <div className="space-y-3 pt-4">
                  {step.fields.map((field) => {
                    if (field.type === "task") {
                      return (
                        <TaskFieldCard
                          key={field.id}
                          field={field}
                          processId={processId}
                          onUpdate={onFieldUpdate}
                        />
                      );
                    }
                    return (
                      <FieldCard
                        key={field.id}
                        field={field}
                        processId={processId}
                        onUpdate={onFieldUpdate}
                      />
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
