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
import { FormField } from "@/components/ui/form-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProcesses } from "@/lib/data/processes";
import type { Process } from "@/types";

interface NewProjectDialogProps {
  onSubmit: (name: string, processId: string) => Promise<void>;
}

export function NewProjectDialog({ onSubmit }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [processesLoading, setProcessesLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setProcessesLoading(true);
      getProcesses().then((data) => {
        setProcesses(data);
        if (data.length === 1) {
          setSelectedProcessId(data[0].id);
        }
        setProcessesLoading(false);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedProcessId) return;

    setLoading(true);
    try {
      await onSubmit(name.trim(), selectedProcessId);
      setName("");
      setSelectedProcessId("");
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
            Neues Projekt starten
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neues Projekt starten</DialogTitle>
            <DialogDescription>
              Wähle einen Prozess und gib deinem neuen Projekt einen Namen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Prozess" htmlFor="project-process">
              {processesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Prozesse laden...
                </div>
              ) : processes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Keine Prozesse vorhanden. Erstelle zuerst einen Prozess.
                </p>
              ) : (
                <Select
                  value={selectedProcessId}
                  onValueChange={setSelectedProcessId}
                  disabled={loading}
                >
                  <SelectTrigger id="project-process">
                    <SelectValue placeholder="Prozess auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {processes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField label="Projektname" htmlFor="project-name">
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Meine SaaS-Idee"
                autoFocus
                disabled={loading}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!name.trim() || !selectedProcessId || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
