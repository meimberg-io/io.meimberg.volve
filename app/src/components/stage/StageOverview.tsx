"use client";

import Link from "next/link";
import {
  Sparkles,
  Eye,
  Search,
  Target,
  Briefcase,
  ListChecks,
  Rocket,
  Check,
  ArrowRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";

interface StageOverviewProps {
  projectId: string;
  stages: Stage[];
  projectProgress: number;
}

const stageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  eye: Eye,
  search: Search,
  target: Target,
  briefcase: Briefcase,
  "list-checks": ListChecks,
  rocket: Rocket,
};

export function StageOverview({
  projectId,
  stages,
  projectProgress,
}: StageOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Gesamtfortschritt</h2>
          <span className="text-sm text-muted-foreground">
            {Math.round(projectProgress)}%
          </span>
        </div>
        <Progress
          value={projectProgress}
          className="h-2"
          indicatorClassName={projectProgress >= 100 ? "bg-emerald-500" : undefined}
        />
      </div>

      {/* Stage Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage, index) => {
          const Icon = stageIcons[stage.icon ?? "sparkles"] ?? Sparkles;
          const isCompleted = stage.status === "completed";
          const isInProgress = stage.status === "in_progress";
          const description = stage.description ?? "";

          return (
            <Link
              key={stage.id}
              href={`/project/${projectId}/stage/${stage.id}`}
              className={cn(
                "process-card group flex flex-col gap-3",
                isCompleted && "border-emerald-500/20",
                isInProgress && "border-primary/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isCompleted
                        ? "bg-emerald-500/10"
                        : isInProgress
                          ? "bg-primary/10"
                          : "bg-secondary"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isInProgress ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Stage {index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary">
                      {stage.name ?? "Stage"}
                    </h3>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>

              {(isInProgress || isCompleted) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Fortschritt</span>
                    <span
                      className={cn(
                        isCompleted ? "text-emerald-400" : "text-primary"
                      )}
                    >
                      {Math.round(stage.progress ?? 0)}%
                    </span>
                  </div>
                  <Progress
                    value={stage.progress ?? 0}
                    className="h-1.5"
                    indicatorClassName={isCompleted ? "bg-emerald-500" : undefined}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
