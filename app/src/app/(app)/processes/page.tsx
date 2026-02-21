"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddProcessDialog } from "@/components/processes/AddProcessDialog";
import { getProcesses, importProcess } from "@/lib/data/processes";
import { storageUrl } from "@/lib/utils";
import type { Process } from "@/types";

export default function ProcessesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["processes"],
    queryFn: getProcesses,
  });

  const handleCreated = async () => {
    const freshProcesses = await getProcesses();
    queryClient.setQueryData<Process[]>(["processes"], freshProcesses);
    if (freshProcesses.length > 0) {
      router.push(`/processes/${freshProcesses[freshProcesses.length - 1].id}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const newProcessId = await importProcess(file);
      await queryClient.invalidateQueries({ queryKey: ["processes"] });
      router.push(`/processes/${newProcessId}`);
    } catch (err) {
      console.error("Import failed:", err);
      alert("Import fehlgeschlagen. Bitte prüfe die JSON-Datei.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prozesse</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            {importing ? "Importiere..." : "Importieren"}
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Neuer Prozess
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      ) : processes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="mb-1 text-lg font-medium">Kein Prozess vorhanden</h3>
          <p className="text-sm text-muted-foreground">
            Erstelle einen neuen Prozess, um zu beginnen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processes.map((process) => (
            <button
              key={process.id}
              onClick={() => router.push(`/processes/${process.id}`)}
              className="group cursor-pointer rounded-xl border border-border bg-card text-left transition-colors hover:border-primary/40 hover:bg-card/80 flex flex-col items-start overflow-hidden"
            >
              {storageUrl(process.header_image) && (
                <img
                  src={storageUrl(process.header_image)!}
                  alt=""
                  className="w-full object-cover"
                  style={{ aspectRatio: "4 / 1" }}
                />
              )}
              <div className="p-5 flex flex-col items-start w-full">
                <h3 className="text-sm font-semibold group-hover:text-primary">
                  {process.name}
                </h3>
                {process.description && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                    {process.description}
                  </p>
                )}
                <p className="mt-3 text-[10px] text-muted-foreground/50">
                  Erstellt: {new Date(process.created_at).toLocaleDateString("de-DE")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <AddProcessDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        context={{ type: "process" }}
        onCreated={handleCreated}
      />
    </div>
  );
}
