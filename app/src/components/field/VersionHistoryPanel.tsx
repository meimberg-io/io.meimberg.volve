"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { RotateCcw, Zap, Wrench, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import type { FieldVersion } from "@/types";

interface VersionHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldInstanceId: string;
  onRestore: (content: string) => void;
}

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  manual: PenLine,
  generate: Zap,
  generate_advanced: Zap,
  optimize: Wrench,
};

const sourceLabels: Record<string, string> = {
  manual: "Manuell",
  generate: "Generiert",
  generate_advanced: "Erweitert generiert",
  optimize: "Optimiert",
};

export function VersionHistoryPanel({
  open,
  onOpenChange,
  fieldInstanceId,
  onRestore,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<FieldVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("field_versions")
        .select("*")
        .eq("field_id", fieldInstanceId)
        .order("created_at", { ascending: false })
        .limit(20);

      setVersions(data ?? []);
      setLoading(false);
    }

    load();
  }, [open, fieldInstanceId]);

  const handleRestore = async (version: FieldVersion) => {
    const supabase = createClient();
    await supabase
      .from("fields")
      .update({ content: version.content, status: "open" })
      .eq("id", fieldInstanceId);

    await supabase.from("field_versions").insert({
      field_id: fieldInstanceId,
      content: version.content,
      source: "manual",
    });

    onRestore(version.content);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Versionshistorie</SheetTitle>
          <SheetDescription>
            Letzte 20 Versionen dieses Feldes
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 -mx-6 px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Versionen vorhanden.
            </p>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const Icon = sourceIcons[version.source] ?? PenLine;
                const label = sourceLabels[version.source] ?? version.source;

                return (
                  <div key={version.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(version.created_at), {
                              addSuffix: true,
                              locale: de,
                            })}
                          </p>
                        </div>
                      </div>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(version)}
                          className="h-7 gap-1 text-xs"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Wiederherstellen
                        </Button>
                      )}
                    </div>
                    <div className="mt-1.5 rounded bg-secondary/50 p-2 text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                      {version.content.slice(0, 500)}
                      {version.content.length > 500 ? "..." : ""}
                    </div>
                    {index < versions.length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
