"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Eye,
  Search,
  Target,
  Briefcase,
  ListChecks,
  Rocket,
  FileText,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";

interface QuickSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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

export function QuickSwitcher({ open, onOpenChange }: QuickSwitcherProps) {
  const router = useRouter();
  const [results, setResults] = useState<{
    processes: SearchResult[];
    stages: SearchResult[];
  }>({ processes: [], stages: [] });

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Get processes
    const { data: processes } = await supabase
      .from("processes")
      .select("*")
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(10);

    // Get stages with their templates
    const { data: stages } = await supabase
      .from("stage_instances")
      .select(`
        *,
        template:stage_templates(*),
        process:processes(id, name, status)
      `)
      .order("created_at", { ascending: true })
      .limit(50);

    const processResults: SearchResult[] = (processes ?? []).map((p) => ({
      id: p.id,
      label: p.name,
      description: p.status === "seeding" ? "Seeding" : "Aktiv",
      href: p.status === "seeding" ? `/process/${p.id}/seed` : `/process/${p.id}`,
      icon: FileText,
    }));

    const stageResults: SearchResult[] = (stages ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((s: any) => s.process?.status === "active")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any) => ({
        id: s.id,
        label: s.template?.name ?? "Stage",
        description: s.process?.name ?? "",
        href: `/process/${s.process_id}/stage/${s.id}`,
        icon: stageIcons[s.template?.icon ?? "sparkles"] ?? Sparkles,
      }));

    setResults({ processes: processResults, stages: stageResults });
  }, []);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Prozess, Stage oder Step suchen..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

        {results.processes.length > 0 && (
          <CommandGroup heading="Prozesse">
            {results.processes.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href)}
                className="gap-3"
              >
                <result.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <span className="font-medium">{result.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {result.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.stages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Stages">
              {results.stages.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result.href)}
                  className="gap-3"
                >
                  <result.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">{result.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {result.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
