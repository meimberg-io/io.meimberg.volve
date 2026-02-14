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
          <div className="flex items-center gap-1.5 pb-2">
            {stages.map((stage, index) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const template = stage.template as any;
              const isActive = stage.id === currentStageId;
              const isCompleted = stage.status === "completed";
              const stageNumber = index + 1;

              return (
                <Link
                  key={stage.id}
                  href={`/process/${processId}/stage/${stage.id}`}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium whitespace-nowrap",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_-3px] shadow-primary/20"
                      : isCompleted
                        ? "bg-accent/10 text-accent border border-accent/15"
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-transparent"
                  )}
                >
                  {/* Number badge */}
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-muted-foreground group-hover:bg-muted-foreground/20"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      stageNumber
                    )}
                  </span>
                  <span className="hidden sm:inline">{template?.name ?? "Stage"}</span>
                  {stage.progress > 0 && stage.progress < 100 && (
                    <Progress value={stage.progress} className="h-1 w-10" />
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
