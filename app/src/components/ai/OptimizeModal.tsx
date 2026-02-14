"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OptimizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldId: string;
  processId: string;
  currentContent: string;
  onResult: (content: string) => void;
}

const QUICK_ACTIONS = [
  "Kürzer fassen",
  "Formeller formulieren",
  "Mit konkreten Zahlen ergänzen",
  "Einfacher formulieren",
  "Als Bullet Points",
  "Mehr Details",
];

export function OptimizeModal({
  open,
  onOpenChange,
  fieldId,
  processId,
  currentContent,
  onResult,
}: OptimizeModalProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    if (!instruction.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_instance_id: fieldId,
          process_id: processId,
          optimize: true,
          optimize_instruction: instruction,
        }),
      });

      if (!response.ok) throw new Error("Optimierung fehlgeschlagen");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
        }
      }

      onResult(accumulated);
      onOpenChange(false);
    } catch (error) {
      console.error("Optimize error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inhalt optimieren</DialogTitle>
          <DialogDescription>
            Gib an, wie der Inhalt verbessert werden soll.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Content Preview */}
          <div className="space-y-2">
            <Label>Aktueller Inhalt</Label>
            <ScrollArea className="max-h-[200px] rounded-md bg-secondary/30 p-3">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {currentContent}
              </div>
            </ScrollArea>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Label>Schnellaktionen</Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <Badge
                  key={action}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setInstruction(action)}
                >
                  {action}
                </Badge>
              ))}
            </div>
          </div>

          {/* Instruction */}
          <div className="space-y-2">
            <Label>Optimierungsanweisung</Label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="z. B. 'Fasse kürzer zusammen', 'Ergänze quantitative Daten'"
              className="min-h-[80px] text-sm"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleOptimize}
            disabled={!instruction.trim() || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Optimieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
