"use client";

import { useState, useCallback } from "react";
import { X, Check, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PromptField } from "@/components/field/PromptField";
import { Label } from "@/components/ui/label";
import { storageUrl } from "@/lib/utils";
import { updateProcessModel } from "@/lib/data/templates";

interface HeaderImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
  modelName: string;
  processDescription: string;
  currentImage: string | null;
  onImageGenerated: (headerImage: string) => void;
}

export function HeaderImageModal({
  open,
  onOpenChange,
  modelId,
  modelName,
  processDescription,
  currentImage,
  onImageGenerated,
}: HeaderImageModalProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatedPath, setGeneratedPath] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/template-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_header_image",
          context: {
            model_id: modelId,
            model_name: modelName,
            process_description: processDescription,
          },
          userPrompt: userPrompt.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error("Image generation failed");
      const data = await response.json();

      const cacheBust = `?t=${Date.now()}`;
      setPreviewImage(storageUrl(data.header_image)! + cacheBust);
      setGeneratedPath(data.header_image);
    } catch (err) {
      console.error("Header image generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [modelId, modelName, processDescription, userPrompt]);

  const handleApply = useCallback(async () => {
    if (!generatedPath) return;
    try {
      await updateProcessModel(modelId, { header_image: generatedPath });
      onImageGenerated(generatedPath);
    } catch (err) {
      console.error("Failed to save header image:", err);
    }
    onOpenChange(false);
    setPreviewImage(null);
    setGeneratedPath(null);
    setUserPrompt("");
  }, [generatedPath, modelId, onImageGenerated, onOpenChange]);

  const handleClose = () => {
    onOpenChange(false);
    setPreviewImage(null);
    setGeneratedPath(null);
    setUserPrompt("");
  };

  const displayImage = previewImage ?? storageUrl(currentImage);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">Headerbild</DialogTitle>
          <DialogDescription className="text-xs">
            KI-generiertes Headerbild für das Prozessmodell
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-0 flex-1 overflow-y-auto">
          {/* Current / generated image */}
          {displayImage && (
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={displayImage}
                alt="Headerbild"
                className="w-full object-cover"
                style={{ aspectRatio: "4 / 1" }}
              />
            </div>
          )}

          {/* Prompt field */}
          <div className="space-y-1.5">
            <Label className="text-xs">Promptergänzung (optional)</Label>
            <PromptField
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={2}
              placeholder="z.B. Farbschema: blau-grün, futuristisch, mit Netzwerklinien..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between shrink-0 pt-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1.5 text-xs cursor-pointer bg-red-500/80 text-white hover:bg-red-500"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
              Schließen
            </Button>
            {generatedPath && !loading && (
              <Button
                size="sm"
                className="gap-1.5 text-xs cursor-pointer bg-green-500/80 text-white hover:bg-green-500"
                onClick={handleApply}
              >
                <Check className="h-3 w-3" />
                Übernehmen
              </Button>
            )}
          </div>
          <Button
            size="sm"
            disabled={loading}
            onClick={handleGenerate}
            className="gap-1.5 text-xs cursor-pointer bg-amber-400 text-black border-amber-400 hover:bg-amber-500 hover:border-amber-500"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {loading ? "Generiere..." : "Generieren"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
