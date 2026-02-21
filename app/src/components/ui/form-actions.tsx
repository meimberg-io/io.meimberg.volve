"use client";

import type { ReactNode } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  children,
  className,
  actions,
}: {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {actions ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={htmlFor}>{label}</Label>
          {actions}
        </div>
      ) : (
        <Label htmlFor={htmlFor}>{label}</Label>
      )}
      {children}
    </div>
  );
}

type BaseProps = {
  label?: string;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function CancelButton({
  label = "Abbrechen",
  className,
  disabled,
  onClick,
}: BaseProps) {
  return (
    <Button
      size="sm"
      className={cn(
        "gap-1.5 text-xs cursor-pointer bg-red-500/80 text-white hover:bg-red-500",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <X className="h-3 w-3" />
      {label}
    </Button>
  );
}

export function SaveButton({
  label = "Speichern",
  loading = false,
  className,
  disabled,
  onClick,
}: BaseProps) {
  return (
    <Button
      size="sm"
      className={cn(
        "gap-1.5 text-xs cursor-pointer bg-green-500/80 text-white hover:bg-green-500",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      {label}
    </Button>
  );
}
