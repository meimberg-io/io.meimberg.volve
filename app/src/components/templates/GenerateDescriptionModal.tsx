"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
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

interface GenerateDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "process_description" | "optimize_description" | "describe_stage" | "describe_step";
  context: Record<string, string>;
  title: string;
  onApply: (description: string) => void;
}

export function GenerateDescriptionModal({
  open,
  onOpenChange,
  mode,
  context,
  title,
  onApply,
}: GenerateDescriptionModalProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai/template-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          context,
          userPrompt: userPrompt || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResult(text);
      }
    } catch {
      setResult("Fehler bei der Generierung. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [mode, context, userPrompt]);

  const handleApply = () => {
    onApply(result);
    onOpenChange(false);
    setResult("");
    setUserPrompt("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setResult("");
    setUserPrompt("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            {title}
          </DialogTitle>
          <DialogDescription>
            KI-gestützte Beschreibung generieren
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-0 overflow-y-auto">
          {mode === "process_description" ? (
            <div className="space-y-2">
              <Label>Beschreibe den Prozess</Label>
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={3}
                placeholder="z.B. Ein Prozess für die Gründung eines SaaS-Unternehmens..."
                autoFocus
              />
            </div>
          ) : mode === "optimize_description" ? (
            <>
              {context.current_description && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Aktuelle Beschreibung</Label>
                  <div className="max-h-[150px] overflow-y-auto rounded-md bg-muted/50 p-2.5">
                    <div className="prose prose-sm prose-invert max-w-none text-xs">
                      <ReactMarkdown>{context.current_description}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Was soll geändert werden?</Label>
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={2}
                  placeholder="z.B. Wir brauchen noch eine Zielgruppenanalyse..."
                  autoFocus
                />
              </div>
            </>
          ) : (
            <>
              {context.process_description && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prozessbeschreibung (Kontext)</Label>
                  <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground max-h-20 overflow-y-auto">
                    {context.process_description}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Zusatzhinweis (optional)</Label>
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={2}
                  placeholder="Optionale Ergänzungen für die Generierung..."
                />
              </div>
            </>
          )}

          {result && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ergebnis</Label>
              <div className="max-h-[250px] overflow-y-auto rounded-md border border-border bg-background p-3">
                <div className="prose prose-sm prose-invert max-w-none text-sm">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-1.5 h-4 w-4" />
            Abbrechen
          </Button>
          {result && !loading ? (
            <Button onClick={handleApply}>
              <Check className="mr-1.5 h-4 w-4" />
              Übernehmen
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={loading || ((mode === "process_description" || mode === "optimize_description") && !userPrompt.trim())}
            >
              {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              {loading ? "Generiere..." : "Generieren"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
