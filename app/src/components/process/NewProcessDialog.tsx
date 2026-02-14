"use client";

import { useState } from "react";
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

interface NewProcessDialogProps {
  onSubmit: (name: string) => Promise<void>;
}

export function NewProcessDialog({ onSubmit }: NewProcessDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(name.trim());
      setName("");
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
              Gib deiner neuen Geschäftsidee einen Namen. Du kannst ihn später ändern.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="process-name">Prozessname</Label>
            <Input
              id="process-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Meine SaaS-Idee"
              className="mt-2"
              autoFocus
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
