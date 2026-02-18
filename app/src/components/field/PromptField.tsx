"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

type PromptFieldProps = Omit<
  React.ComponentProps<typeof Textarea>,
  "className"
> & {
  className?: string;
};

export const PromptField = forwardRef<HTMLTextAreaElement, PromptFieldProps>(
  ({ className, placeholder = "Prompt...", rows = 2, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          "text-amber-400 placeholder:text-amber-400/40 border-amber-400/30 focus-visible:border-amber-400/50 focus-visible:ring-0",
          className
        )}
        {...props}
      />
    );
  }
);

PromptField.displayName = "PromptField";
