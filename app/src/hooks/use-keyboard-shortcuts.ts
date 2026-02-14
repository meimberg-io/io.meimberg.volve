import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onQuickSwitcher?: () => void;
}

export function useKeyboardShortcuts({ onQuickSwitcher }: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.metaKey || e.ctrlKey;

      // Ctrl+K: Quick Switcher
      if (isCtrlOrCmd && e.key === "k") {
        e.preventDefault();
        onQuickSwitcher?.();
      }
    },
    [onQuickSwitcher]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
