"use client";

import { Check, AlertTriangle } from "lucide-react";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const template = stage.template as any;

  // Find first step with open/empty fields for default expanded
  const firstOpenStep = stage.steps.find(
    (s) => s.status !== "completed"
  );

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">{template?.name ?? "Stage"}</h1>
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
        {template?.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {template.description}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stepTemplate = step.template as any;
          const totalFields = step.fields.length;
          const closedFields = step.fields.filter(
            (f) => f.status === "closed"
          ).length;
          const isCompleted = step.status === "completed";
          const stepLetter = String.fromCharCode(65 + index); // A, B, C, ...

          // Check for dependency warnings (step has fields with dependencies on unclosed fields)
          const hasDepWarning = step.fields.some((f) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ft = f.template as any;
            return (
              ft?.dependencies &&
              ft.dependencies.length > 0 &&
              f.status !== "closed"
            );
          });

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
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {stepTemplate?.name ?? "Step"}
                      </span>
                      {hasDepWarning && !isCompleted && (
                        <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
                      )}
                      {!isCompleted && totalFields > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {closedFields}/{totalFields}
                        </span>
                      )}
                    </div>
                    {stepTemplate?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {stepTemplate.description}
                      </p>
                    )}
                  </div>

                  {!isCompleted && totalFields > 0 && (
                    <Progress
                      value={(closedFields / totalFields) * 100}
                      className="h-1 w-16"
                    />
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="bg-card px-5 pb-5">
                <div className="space-y-3 pt-4">
                  {step.fields.map((field) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fieldTemplate = field.template as any;
                    if (fieldTemplate?.type === "task") {
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
