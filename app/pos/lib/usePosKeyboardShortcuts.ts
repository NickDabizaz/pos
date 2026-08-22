import { useEffect } from "react";

type PosShortcutsProps = {
  onEscape         ?: () => void;
  onFocusSearch    ?: () => void;
  onTriggerPayment ?: () => void;
};

export function usePosKeyboardShortcuts({
  onEscape,
  onFocusSearch,
  onTriggerPayment,
}: PosShortcutsProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const activeElement = document.activeElement;
      const isInputActive =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement;

      if (event.key === "F2") {
        event.preventDefault();
        onFocusSearch?.();
        return;
      }

      if (event.key === "/" && !isInputActive) {
        event.preventDefault();
        onFocusSearch?.();
        return;
      }

      if (event.key === "F4") {
        event.preventDefault();
        onTriggerPayment?.();
        return;
      }

      if (event.key === "Escape") {
        onEscape?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEscape, onFocusSearch, onTriggerPayment]);
}
