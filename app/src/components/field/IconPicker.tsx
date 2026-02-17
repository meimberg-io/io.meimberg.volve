"use client";

import { useState, useMemo, createElement } from "react";
import { icons } from "lucide-react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

function toKebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function toPascal(name: string): string {
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

const allIcons = Object.keys(icons).map((pascal) => ({
  pascal,
  kebab: toKebab(pascal),
}));

const MAX_DISPLAY = 200;

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return allIcons.slice(0, MAX_DISPLAY);
    const q = search.toLowerCase();
    return allIcons.filter((i) => i.kebab.includes(q)).slice(0, MAX_DISPLAY);
  }, [search]);

  const handleSelect = (kebab: string) => {
    onChange(kebab);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
    setSearch("");
  };

  const valuePascal = value ? toPascal(value) : "";
  const IconComponent = valuePascal && icons[valuePascal as keyof typeof icons];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 text-xs cursor-pointer h-9",
            !value && "text-muted-foreground",
            open && "border-ring!",
            className
          )}
        >
          {IconComponent ? (
            <>
              {createElement(IconComponent, { className: "h-4 w-4 shrink-0" })}
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span>Icon auswählen...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        side="left"
        align="start"
        sideOffset={8}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Icon suchen..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {value && (
            <button
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              title="Icon entfernen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div
          className="grid grid-cols-8 gap-1 p-2 max-h-[280px] overflow-y-auto [scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          onWheel={(e) => e.stopPropagation()}
        >
          {filtered.map(({ pascal, kebab }) => {
            const Icon = icons[pascal as keyof typeof icons];
            return (
              <button
                key={kebab}
                onClick={() => handleSelect(kebab)}
                title={kebab}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer",
                  value === kebab
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                )}
              >
                {createElement(Icon, { className: "h-4 w-4" })}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-8 py-4 text-center text-xs text-muted-foreground">
              Keine Icons gefunden
            </p>
          )}
        </div>
        {!search.trim() && (
          <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground text-center">
            Suche nutzen für alle {allIcons.length} Icons
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
