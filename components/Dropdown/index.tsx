"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { DropdownProps } from "@/components/Dropdown/lib/types";

export type { DropdownOption, DropdownProps } from "@/components/Dropdown/lib/types";

export default function Dropdown<T extends string = string>({
  className     = "",
  disabled      = false,
  label,
  onChangeAction,
  options,
  placeholder   = "Pilih...",
  required      = false,
  value,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);
  const listId               = useId();
  const selected              = options.find((option) => option.value === value);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className={`relative ${className}`.trim()} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-status-danger-fg"> *</span>}
        </label>
      )}

      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground ${
          isOpen ? "ring-2 ring-ring" : ""
        }`}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          aria-hidden="true"
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <ul
          className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-xl shadow-slate-950/10"
          id={listId}
          role="listbox"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                aria-selected={option.value === value}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                  option.value === value
                    ? "bg-secondary font-medium text-foreground"
                    : "text-foreground hover:bg-secondary/60"
                }`}
                onClick={() => {
                  onChangeAction(option.value);
                  setIsOpen(false);
                }}
                role="option"
                type="button"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
