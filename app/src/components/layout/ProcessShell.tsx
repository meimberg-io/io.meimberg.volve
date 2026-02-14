"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Sparkles,
  Eye,
  Search,
  Target,
  Briefcase,
  ListChecks,
  Rocket,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { StageInstance } from "@/types";

interface ProcessShellProps {
  children: ReactNode;
  processId: string;
  processName: string;
  stages: StageInstance[];
  currentStageId?: string;
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

export function ProcessShell({
  children,
  processId,
  processName,
  stages,
  currentStageId,
}: ProcessShellProps) {
  const pathname = usePathname();
  const isSeedView = pathname.includes("/seed");

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/process/${processId}`}
          className="hover:text-foreground transition-colors"
        >
          {processName}
        </Link>
        {currentStageId && stages.length > 0 && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {stages.find((s) => s.id === currentStageId)?.template?.name ?? "Stage"}
            </span>
          </>
        )}
        {isSeedView && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">Seeding</span>
          </>
        )}
      </nav>

      {/* Persistent Stage Navigation */}
      {!isSeedView && stages.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex items-center gap-1 pb-2">
            {stages.map((stage) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const template = stage.template as any;
              const Icon = stageIcons[template?.icon ?? "sparkles"] ?? Sparkles;
              const isActive = stage.id === currentStageId;
              const isCompleted = stage.status === "completed";

              return (
                <Link
                  key={stage.id}
                  href={`/process/${processId}/stage/${stage.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : isCompleted
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{template?.name ?? "Stage"}</span>
                  {stage.progress > 0 && stage.progress < 100 && (
                    <Progress value={stage.progress} className="h-1 w-12" />
                  )}
                </Link>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Content */}
      {children}
    </div>
  );
}
