"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./MarkdownEditor";

interface MarkdownFieldProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: string;
  className?: string;
  autoScroll?: boolean;
}

export function MarkdownField({
  content,
  onChange,
  placeholder,
  disabled = false,
  maxHeight = "300px",
  className,
  autoScroll = false,
}: MarkdownFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [autoScroll, content]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-md border border-border/50 bg-secondary/30 p-3 overflow-y-auto overflow-x-hidden transition-colors [scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border",
        !disabled && "focus-within:border-ring",
        className
      )}
      style={{ maxHeight }}
    >
      <MarkdownEditor
        content={content}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoScroll={autoScroll}
      />
    </div>
  );
}
