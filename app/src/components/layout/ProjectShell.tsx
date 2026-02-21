"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Check,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Stage } from "@/types";

interface ProjectShellProps {
  children: ReactNode;
  projectId: string;
  projectName: string;
  stages: Stage[];
  currentStageId?: string;
}

export function ProjectShell({
  children,
  projectId,
  projectName,
  stages,
  currentStageId,
}: ProjectShellProps) {
  const pathname = usePathname();
  const isSeedView = pathname.includes("/seed");

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projekte
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/project/${projectId}`}
          className="hover:text-foreground transition-colors"
        >
          {projectName}
        </Link>
        {!isSeedView && (
          <Link href={`/project/${projectId}/edit`} className="ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs cursor-pointer">
              <Pencil className="h-3 w-3" />
              Projekt bearbeiten
            </Button>
          </Link>
        )}
        {currentStageId && stages.length > 0 && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">
              {stages.find((s) => s.id === currentStageId)?.name ?? "Stage"}
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

      {/* Layout: Sidebar + Content */}
      {!isSeedView && stages.length > 0 ? (
        <>
          {/* Mobile: Horizontal Stage Nav */}
          <ScrollArea className="w-full md:hidden">
            <div className="flex items-center gap-1.5 pb-2">
              {stages.map((stage, index) => {
                const isActive = stage.id === currentStageId;
                const isCompleted = stage.status === "completed";
                const stageNumber = index + 1;

                return (
                  <Link
                    key={stage.id}
                    href={`/project/${projectId}/stage/${stage.id}`}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium whitespace-nowrap",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_-3px] shadow-primary/20"
                        : isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-transparent"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-secondary text-muted-foreground group-hover:bg-muted-foreground/20"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        stageNumber
                      )}
                    </span>
                    <span>{stage.name ?? "Stage"}</span>
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Desktop: Sidebar + Content side by side */}
          <div className="md:flex md:gap-6 md:items-start">
            {/* Stage Sidebar (desktop only) */}
            <nav className="hidden md:flex w-56 shrink-0 flex-col gap-1.5 sticky top-20">
              {stages.map((stage, index) => {
                const isActive = stage.id === currentStageId;
                const isCompleted = stage.status === "completed";
                const stageNumber = index + 1;

                return (
                  <Link
                    key={stage.id}
                    href={`/project/${projectId}/stage/${stage.id}`}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_-3px] shadow-primary/20"
                        : isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
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
                            ? "bg-emerald-500 text-white"
                            : "bg-secondary text-muted-foreground group-hover:bg-muted-foreground/20"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        stageNumber
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{stage.name ?? "Stage"}</span>
                      {(stage.progress ?? 0) > 0 && (stage.progress ?? 0) < 100 && (
                        <Progress value={stage.progress ?? 0} className="h-1 mt-1" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </>
      ) : (
        /* Seed view or no stages: full width content */
        children
      )}
    </div>
  );
}
