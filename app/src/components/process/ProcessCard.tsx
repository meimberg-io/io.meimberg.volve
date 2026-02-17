"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  Sparkles,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Sprout,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { storageUrl } from "@/lib/utils";
import type { Process } from "@/types";

type ProcessWithImage = Process & {
  process_models?: { header_image: string | null } | null;
};

interface ProcessCardProps {
  process: ProcessWithImage;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}

const statusLabels: Record<string, string> = {
  seeding: "Seeding",
  active: "Aktiv",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};

const statusColors: Record<string, string> = {
  seeding: "bg-status-warning/20 text-status-warning",
  active: "bg-status-open/20 text-status-open",
  completed: "bg-status-closed/20 text-status-closed",
  archived: "bg-status-muted/20 text-status-muted",
};

export function ProcessCard({ process, onArchive, onUnarchive }: ProcessCardProps) {
  const href =
    process.status === "seeding"
      ? `/process/${process.id}/seed`
      : `/process/${process.id}`;

  const timeAgo = formatDistanceToNow(new Date(process.updated_at), {
    addSuffix: true,
    locale: de,
  });

  const headerImage = storageUrl(process.process_models?.header_image);

  return (
    <div className="process-card group">
      {headerImage && (
        <Link href={href} className="-mx-6 -mt-6 mb-6 block overflow-hidden rounded-t-xl">
          <img
            src={headerImage}
            alt=""
            className="w-full object-cover"
            style={{ aspectRatio: "4 / 1" }}
          />
        </Link>
      )}
      <div className="flex items-start justify-between">
        <Link href={href} className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {process.status === "seeding" ? (
                <Sprout className="h-5 w-5 text-status-warning" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {process.name}
              </h3>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {process.status !== "archived" ? (
              <DropdownMenuItem onClick={() => onArchive?.(process.id)} className="gap-2">
                <Archive className="h-4 w-4" />
                Archivieren
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onUnarchive?.(process.id)} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reaktivieren
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={href}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={statusColors[process.status]}
            >
              {statusLabels[process.status]}
            </Badge>
            {process.status === "active" && (
              <span className="text-xs text-muted-foreground">
                {Math.round(process.progress)}%
              </span>
            )}
          </div>

          {process.status === "active" && (
            <Progress value={process.progress} className="h-1.5" />
          )}
        </div>
      </Link>
    </div>
  );
}
