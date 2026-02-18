"use client";

import { useState, useEffect } from "react";
import { LinkIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { createClient } from "@/lib/supabase/client";

interface DependencyHintProps {
  dependencyIds: string[];
  processId: string;
}

interface DepInfo {
  fieldId: string;
  name: string;
  content: string | null;
}

export function DependencyHint({
  dependencyIds,
  processId,
}: DependencyHintProps) {
  const [deps, setDeps] = useState<DepInfo[]>([]);

  useEffect(() => {
    async function loadDeps() {
      if (dependencyIds.length === 0) return;

      const supabase = createClient();

      // Get fields matching these IDs in this process (using snapshot columns)
      const { data: instances } = await supabase
        .from("fields")
        .select(`
          id,
          content,
          name,
          step:steps(
            stage:stages(process_id)
          )
        `)
        .in("id", dependencyIds);

      if (!instances) return;

      const depInfos: DepInfo[] = dependencyIds
        .map((depId) => {
          const instance = instances.find(
            (i) =>
              i.id === depId &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (i as any).step?.stage?.process_id === processId
          );
          return {
            fieldId: depId,
            name: instance?.name ?? "Feld",
            content: instance?.content ?? null,
          };
        })
        .filter((d) => d.name !== "Feld" || d.content !== null);

      setDeps(depInfos);
    }

    loadDeps();
  }, [dependencyIds, processId]);

  if (deps.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <LinkIcon className="h-3 w-3" />
      <span>Input von:</span>
      {deps.map((dep, i) => (
        <span key={dep.fieldId}>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="text-primary/80 hover:text-primary underline-offset-2 hover:underline">
                {dep.name}
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 text-sm">
              <p className="font-medium mb-1">{dep.name}</p>
              {dep.content ? (
                <p className="text-muted-foreground text-xs line-clamp-6 whitespace-pre-wrap">
                  {dep.content.slice(0, 300)}
                  {dep.content.length > 300 ? "..." : ""}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  Noch kein Inhalt vorhanden
                </p>
              )}
            </HoverCardContent>
          </HoverCard>
          {i < deps.length - 1 && ", "}
        </span>
      ))}
    </div>
  );
}
