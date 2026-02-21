"use client";

import { forwardRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const variantStyles = {
  modelling:
    "text-amber-400 border-amber-400/30 hover:!bg-amber-400 hover:!text-black hover:!border-amber-400",
  execution:
    "text-blue-400 border-blue-400/30 hover:!bg-blue-400 hover:!text-black hover:!border-blue-400",
};

export type AiButtonVariant = keyof typeof variantStyles;

type AiButtonProps = Omit<React.ComponentProps<typeof Button>, "variant"> & {
  loading?: boolean;
  aiVariant?: AiButtonVariant;
};

export const AiButton = forwardRef<HTMLButtonElement, AiButtonProps>(
  ({ className, loading, disabled, aiVariant = "modelling", children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        className={cn(
          "gap-1.5 text-xs cursor-pointer",
          variantStyles[aiVariant],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {children}
      </Button>
    );
  }
);

AiButton.displayName = "AiButton";
