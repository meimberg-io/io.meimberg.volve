"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTemplateDialog } from "@/components/templates/AddTemplateDialog";
import { getProcessModels } from "@/lib/data/templates";
import type { ProcessModel } from "@/types";

export default function TemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["process-models"],
    queryFn: getProcessModels,
  });

  const handleCreated = async () => {
    const freshModels = await getProcessModels();
    queryClient.setQueryData<ProcessModel[]>(["process-models"], freshModels);
    if (freshModels.length > 0) {
      router.push(`/templates/${freshModels[freshModels.length - 1].id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Button
          onClick={() => setShowAddDialog(true)}
          variant="outline"
          size="sm"
          className="cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Neues Modell
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="mb-1 text-lg font-medium">Kein Modell vorhanden</h3>
          <p className="text-sm text-muted-foreground">
            Erstelle ein neues Prozessmodell, um zu beginnen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => router.push(`/templates/${model.id}`)}
              className="group cursor-pointer rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-card/80 flex flex-col items-start"
            >
              <h3 className="text-sm font-semibold group-hover:text-primary">
                {model.name}
              </h3>
              {model.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                  {model.description}
                </p>
              )}
              <p className="mt-3 text-[10px] text-muted-foreground/50">
                Erstellt: {new Date(model.created_at).toLocaleDateString("de-DE")}
              </p>
            </button>
          ))}
        </div>
      )}

      <AddTemplateDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        context={{ type: "model" }}
        onCreated={handleCreated}
      />
    </div>
  );
}
