"use client";

import { useCallback, useState } from "react";
import {
  Upload,
  FileText,
  Image,
  Trash2,
  Sprout,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { SeedDocument } from "@/types";

interface SeedingViewProps {
  processName: string;
  documents: SeedDocument[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (docId: string, storagePath: string) => Promise<void>;
  onPlantSeed: () => Promise<void>;
}

const ACCEPTED_TYPES = [
  ".md",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  return FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SeedingView({
  processName,
  documents,
  onUpload,
  onDelete,
  onPlantSeed,
}: SeedingViewProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [planting, setPlanting] = useState(false);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      setUploading(true);
      try {
        await onUpload(files);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      setUploading(true);
      try {
        await onUpload(files);
      } finally {
        setUploading(false);
      }
      // Reset input
      e.target.value = "";
    },
    [onUpload]
  );

  const handlePlant = async () => {
    setPlanting(true);
    try {
      await onPlantSeed();
    } finally {
      setPlanting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-status-warning/10">
          <Sprout className="h-7 w-7 text-status-warning" />
        </div>
        <h1 className="text-2xl font-bold">{processName}</h1>
        <p className="text-muted-foreground">
          Lade deine Ausgangsmaterialien hoch -- Ideen, Notizen, Bilder.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        )}
        onClick={() => document.getElementById("seed-file-input")?.click()}
      >
        <input
          id="seed-file-input"
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={handleFileSelect}
        />

        {uploading ? (
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        ) : (
          <Upload
            className={cn(
              "h-10 w-10 transition-colors",
              dragOver ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}

        <div className="text-center">
          <p className="font-medium">
            {dragOver ? "Hier ablegen" : "Dateien hierher ziehen"}
          </p>
          <p className="text-sm text-muted-foreground">
            oder klicken zum Auswählen -- MD, TXT, Bilder, PDF
          </p>
        </div>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {documents.length} Dokument{documents.length !== 1 ? "e" : ""} hochgeladen
          </h2>
          <div className="space-y-2">
            {documents.map((doc) => {
              const FileIcon = getFileIcon(doc.mime_type);
              return (
                <Card key={doc.id} className="transition-all hover:bg-card/80">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-sm">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size_bytes)} --{" "}
                        {formatDistanceToNow(new Date(doc.created_at), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{doc.filename}&quot; wird unwiderruflich gelöscht.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(doc.id, doc.storage_path)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Plant Seed Button */}
      <div className="flex flex-col items-center gap-3 pt-4">
        {documents.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-status-warning">
            <AlertCircle className="h-4 w-4" />
            Lade mindestens ein Dokument hoch, bevor du fortfährst.
          </div>
        )}
        <Button
          size="lg"
          onClick={handlePlant}
          disabled={documents.length === 0 || planting}
          className="gap-2 px-8"
        >
          {planting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sprout className="h-5 w-5" />
          )}
          Prozess starten
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Nach dem Start können die Seed-Dokumente nicht mehr geändert werden.
        </p>
      </div>
    </div>
  );
}
