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
  dependencyTemplateIds: string[];
  processId: string;
}

interface DepInfo {
  templateId: string;
  name: string;
  content: string | null;
}

export function DependencyHint({
  dependencyTemplateIds,
  processId,
}: DependencyHintProps) {
  const [deps, setDeps] = useState<DepInfo[]>([]);

  useEffect(() => {
    async function loadDeps() {
      if (dependencyTemplateIds.length === 0) return;

      const supabase = createClient();

      // Get field instances matching these templates in this process
      const { data: templates } = await supabase
        .from("field_templates")
        .select("id, name")
        .in("id", dependencyTemplateIds);

      if (!templates) return;

      const { data: instances } = await supabase
        .from("field_instances")
        .select(`
          content,
          field_template_id,
          step_instance:step_instances(
            stage_instance:stage_instances(process_id)
          )
        `)
        .in("field_template_id", dependencyTemplateIds);

      const depInfos: DepInfo[] = templates.map((t) => {
        const instance = instances?.find(
          (i) =>
            i.field_template_id === t.id &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (i as any).step_instance?.stage_instance?.process_id === processId
        );
        return {
          templateId: t.id,
          name: t.name,
          content: instance?.content ?? null,
        };
      });

      setDeps(depInfos);
    }

    loadDeps();
  }, [dependencyTemplateIds, processId]);

  if (deps.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <LinkIcon className="h-3 w-3" />
      <span>Input von:</span>
      {deps.map((dep, i) => (
        <span key={dep.templateId}>
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
