"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Check,
  UserCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MarkdownEditor } from "./MarkdownEditor";
import { DependencyHint } from "./DependencyHint";
import type { Field, Task, TaskStatus } from "@/types";

interface TaskFieldCardProps {
  field: Field;
  processId: string;
  onUpdate: () => void;
}

const statusLabels: Record<TaskStatus, string> = {
  planned: "Geplant",
  delegated: "Delegiert",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
  accepted: "Abgenommen",
};

const statusColors: Record<TaskStatus, string> = {
  planned: "bg-status-muted/20 text-status-muted",
  delegated: "bg-status-warning/20 text-status-warning",
  in_progress: "bg-status-open/20 text-status-open",
  done: "bg-accent/20 text-accent",
  accepted: "bg-accent/20 text-accent",
};

const statusTransitions: Record<TaskStatus, { label: string; next: TaskStatus }[]> = {
  planned: [
    { label: "Starten", next: "in_progress" },
    { label: "Delegieren", next: "delegated" },
  ],
  delegated: [
    { label: "In Bearbeitung setzen", next: "in_progress" },
  ],
  in_progress: [
    { label: "Erledigt", next: "done" },
  ],
  done: [
    { label: "Abnehmen", next: "accepted" },
  ],
  accepted: [],
};

export function TaskFieldCard({ field, processId, onUpdate }: TaskFieldCardProps) {
  const dependencies: string[] = field.dependencies ?? [];
  const isClosed = field.status === "closed";

  const [task, setTask] = useState<Task | null>(null);
  const [description, setDescription] = useState(field.content ?? "");
  const [assignee, setAssignee] = useState("");
  const [taskType, setTaskType] = useState<string>("self");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadTask = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("field_id", field.id)
      .single();

    if (data) {
      setTask(data);
      setDescription(data.description || field.content || "");
      setAssignee(data.assignee || "");
      setTaskType(data.type || "self");
      setResult(data.result || "");
    }
    setLoading(false);
  }, [field.id, field.content]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const updateTask = async (updates: Partial<Task>) => {
    if (!task) return;
    const supabase = createClient();
    await supabase.from("tasks").update(updates).eq("id", task.id);

    // If status transitions to 'accepted', also close the field
    if (updates.status === "accepted") {
      await supabase
        .from("fields")
        .update({ status: "closed" })
        .eq("id", field.id);
    }

    loadTask();
    onUpdate();
  };

  const handleStatusTransition = async (nextStatus: TaskStatus) => {
    const updates: Partial<Task> = { status: nextStatus };

    if (nextStatus === "done" && !result.trim()) {
      return; // Need result before marking done
    }

    await updateTask(updates);
  };

  const handleDescriptionChange = useCallback(
    async (value: string) => {
      setDescription(value);
      if (task) {
        const supabase = createClient();
        await supabase
          .from("tasks")
          .update({ description: value })
          .eq("id", task.id);
        await supabase
          .from("fields")
          .update({ content: value, status: value.trim() ? "open" : "empty" })
          .eq("id", field.id);
      }
    },
    [task, field.id]
  );

  const handleAssigneeChange = async (value: string) => {
    setAssignee(value);
    const newType = value.trim() ? "delegated" : "self";
    setTaskType(newType);
    if (task) {
      await updateTask({ assignee: value, type: newType as Task["type"] });
    }
  };

  const handleResultChange = useCallback(
    async (value: string) => {
      setResult(value);
      if (task) {
        const supabase = createClient();
        await supabase.from("tasks").update({ result: value }).eq("id", task.id);
      }
    },
    [task]
  );

  const handleGenerate = async () => {
    setGenerating(true);
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
          accumulated += decoder.decode(value, { stream: true });
          setDescription(accumulated);
        }
      }

      handleDescriptionChange(accumulated);
    } finally {
      setGenerating(false);
    }
  };

  const taskStatus = (task?.status ?? "planned") as TaskStatus;
  const transitions = statusTransitions[taskStatus] ?? [];

  if (loading) {
    return (
      <div className="field-card field-card-open animate-pulse">
        <div className="h-4 bg-secondary rounded w-1/3 mb-4" />
        <div className="h-20 bg-secondary rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "field-card",
        isClosed ? "field-card-closed" : "field-card-open",
        "bg-card/80"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">{field.name ?? "Task"}</h4>
          <Badge variant="secondary" className={statusColors[taskStatus]}>
            {statusLabels[taskStatus]}
          </Badge>
        </div>
        {!isClosed && field.ai_prompt && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-400 hover:!bg-blue-400 hover:!text-black"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Beschreibung generieren</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <DependencyHint
          dependencyIds={dependencies}
          processId={processId}
        />
      )}

      {/* Task Description */}
      <div className="space-y-3 mt-2">
        <FormField label="Beschreibung">
          {isClosed ? (
            <div className="text-sm whitespace-pre-wrap opacity-80">{description}</div>
          ) : (
            <MarkdownEditor
              content={description}
              onChange={handleDescriptionChange}
              placeholder="Aufgabenbeschreibung..."
              disabled={isClosed}
              autoScroll={generating}
            />
          )}
        </FormField>

        {/* Assignee & Type */}
        {!isClosed && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Zuständig">
              <div className="relative">
                <UserCircle className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={assignee}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  placeholder="Name..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </FormField>
            <FormField label="Typ">
              <Select value={taskType} onValueChange={(v) => setTaskType(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Selbst</SelectItem>
                  <SelectItem value="delegated">Delegiert</SelectItem>
                  <SelectItem value="agent" disabled>
                    Agent (bald)
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        )}

        {/* Result (shown when in_progress or done) */}
        {(taskStatus === "in_progress" || taskStatus === "done") && (
          <FormField label="Ergebnis">
            <MarkdownEditor
              content={result}
              onChange={handleResultChange}
              placeholder="Ergebnis dokumentieren..."
              disabled={taskStatus === "done"}
            />
          </FormField>
        )}

        {/* Status Transitions */}
        {!isClosed && transitions.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-border/30">
            {transitions.map((transition) => (
              <Button
                key={transition.next}
                variant={transition.next === "accepted" || transition.next === "done" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusTransition(transition.next)}
                className="gap-1.5 text-xs"
                disabled={
                  transition.next === "done" && !result.trim()
                }
              >
                {transition.next === "accepted" || transition.next === "done" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                {transition.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
