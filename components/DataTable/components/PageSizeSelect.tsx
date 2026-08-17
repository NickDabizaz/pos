"use client";

import { useEffect, useRef, useState } from "react";

type PageSizeSelectProps = {
  options : number[];
  value   : number;
  onChange: (value: number) => void;
};

export default function PageSizeSelect({
  options,
  value,
  onChange,
}: PageSizeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isOpen]);

  function selectPageSize(pageSize: number) {
    onChange(pageSize);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Jumlah baris per halaman"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex h-9 min-w-18 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-900/5 transition hover:border-slate-500 hover:bg-slate-50 focus-visible:border-slate-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }

          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        type="button"
      >
        <span>{value}</span>
        <svg
          aria-hidden="true"
          className={`size-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="m7 10 5 5 5-5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          aria-label="Jumlah baris per halaman"
          className="absolute bottom-full left-0 z-30 mb-2 min-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option === value;

            return (
              <button
                aria-selected={isSelected}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500 ${
                  isSelected
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                key={option}
                onClick={() => selectPageSize(option)}
                role="option"
                type="button"
              >
                <span>{option}</span>
                {isSelected && (
                  <svg
                    aria-hidden="true"
                    className="size-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="m5 12 4 4L19 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
