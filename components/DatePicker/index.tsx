"use client";

import { useEffect, useRef, useState } from "react";

import DatePickerCalendar from "@/components/DatePicker/components/DatePickerCalendar";
import { displayToIso, isoToDisplay } from "@/components/DatePicker/lib/dateFormat";
import type { DatePickerProps } from "@/components/DatePicker/lib/types";

export type { DatePickerProps } from "@/components/DatePicker/lib/types";

export default function DatePicker({
  className     = "",
  disabled      = false,
  label,
  onChangeAction,
  placeholder   = "dd/mm/yyyy",
  required      = false,
  value,
}: DatePickerProps) {
  const [text, setText]       = useState(() => isoToDisplay(value ?? ""));
  const [syncedValue, setSyncedValue] = useState(value);
  const [isOpen, setIsOpen]   = useState(false);
  const [view, setView]       = useState(() => {
    const reference = value ? new Date(value) : new Date();
    return { year: reference.getFullYear(), month: reference.getMonth() };
  });
  const containerRef = useRef<HTMLDivElement>(null);

  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(isoToDisplay(value ?? ""));
  }

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setText(isoToDisplay(value ?? ""));
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [value]);

  function openCalendar() {
    const reference = value ? new Date(value) : new Date();
    setView({ year: reference.getFullYear(), month: reference.getMonth() });
    setIsOpen(true);
  }

  function commitTypedText() {
    const iso = displayToIso(text);

    if (iso) {
      onChangeAction(iso);
    } else {
      setText(isoToDisplay(value ?? ""));
    }
  }

  return (
    <div className={`relative ${className}`.trim()} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-status-danger-fg"> *</span>}
        </label>
      )}

      <div className="flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
        <input
          className="w-full bg-transparent px-3 py-2 text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:text-muted-foreground"
          disabled={disabled}
          onBlur={commitTypedText}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitTypedText();
            }
          }}
          placeholder={placeholder}
          type="text"
          value={text}
        />
        <button
          aria-label="Buka kalender"
          className="px-2.5 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
          type="button"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="16" rx="2" width="18" x="3" y="4" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-2 rounded-2xl border border-border bg-card shadow-xl shadow-slate-950/10">
          <DatePickerCalendar
            onSelectAction={(iso) => {
              onChangeAction(iso);
              setIsOpen(false);
            }}
            onViewChangeAction={(year, month) => setView({ year, month })}
            selectedIso={value}
            viewMonth={view.month}
            viewYear={view.year}
          />
        </div>
      )}
    </div>
  );
}
