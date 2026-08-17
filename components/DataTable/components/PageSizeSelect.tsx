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
        aria-expanded   = {isOpen}
        aria-haspopup   = "listbox"
        aria-label      = "Jumlah baris per halaman"
        className       = "flex h-8 min-w-16 items-center justify-between gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-xs transition-all hover:border-border-strong hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick         = {() => setIsOpen((current) => !current)}
        onKeyDown       = {(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }

          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        type            = "button"
      >
        <span className="tabular-nums">{value}</span>
        <svg
          aria-hidden="true"
          className={`size-3.5 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
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
          className="absolute bottom-full left-0 z-30 mb-1.5 min-w-full overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg ring-1 ring-black/5"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option === value;

            return (
              <button
                aria-selected={isSelected}
                className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                key={option}
                onClick={() => selectPageSize(option)}
                role="option"
                type="button"
              >
                <span className="tabular-nums">{option}</span>
                {isSelected && (
                  <svg
                    aria-hidden="true"
                    className="size-3.5 text-primary-foreground"
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
