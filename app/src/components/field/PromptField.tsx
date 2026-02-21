"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const variantStyles = {
  modelling: {
    text: "text-amber-400",
    placeholder: "placeholder:text-amber-400/40",
    border: "border-amber-400/30",
    focus: "focus-visible:border-amber-400/50",
  },
  execution: {
    text: "text-blue-400",
    placeholder: "placeholder:text-blue-400/40",
    border: "border-blue-400/30",
    focus: "focus-visible:border-blue-400/50",
  },
  global: {
    text: "text-red-400",
    placeholder: "placeholder:text-red-400/40",
    border: "border-red-400/30",
    focus: "focus-visible:border-red-400/50",
  },
} as const;

export type PromptVariant = keyof typeof variantStyles;

type PromptFieldProps = Omit<
  React.ComponentProps<typeof Textarea>,
  "className"
> & {
  className?: string;
  variant?: PromptVariant;
};

export const PromptField = forwardRef<HTMLTextAreaElement, PromptFieldProps>(
  ({ className, variant = "modelling", placeholder = "Prompt...", rows = 2, ...props }, ref) => {
    const s = variantStyles[variant];
    return (
      <Textarea
        ref={ref}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          s.text, s.placeholder, s.border, s.focus,
          "focus-visible:ring-0",
          className
        )}
        {...props}
      />
    );
  }
);

PromptField.displayName = "PromptField";
