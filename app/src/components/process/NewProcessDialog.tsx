"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTemplates } from "@/lib/data/templates";
import type { Process } from "@/types";

interface NewProcessDialogProps {
  onSubmit: (name: string, modelId: string) => Promise<void>;
}

export function NewProcessDialog({ onSubmit }: NewProcessDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [models, setModels] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setModelsLoading(true);
      getTemplates().then((data) => {
        setModels(data);
        if (data.length === 1) {
          setSelectedModelId(data[0].id);
        }
        setModelsLoading(false);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedModelId) return;

    setLoading(true);
    try {
      await onSubmit(name.trim(), selectedModelId);
      setName("");
      setSelectedModelId("");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="process-card flex flex-col items-center justify-center gap-3 border-dashed border-2 border-border bg-transparent hover:border-primary/50 min-h-[160px] cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Neuen Prozess starten
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neuen Prozess starten</DialogTitle>
            <DialogDescription>
              Wähle ein Template und gib deinem neuen Prozess einen Namen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="process-template">Template</Label>
              {modelsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Templates laden...
                </div>
              ) : models.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Keine Templates vorhanden. Erstelle zuerst ein Template.
                </p>
              ) : (
                <Select
                  value={selectedModelId}
                  onValueChange={setSelectedModelId}
                  disabled={loading}
                >
                  <SelectTrigger id="process-template">
                    <SelectValue placeholder="Template auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="process-name">Prozessname</Label>
              <Input
                id="process-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Meine SaaS-Idee"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!name.trim() || !selectedModelId || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
