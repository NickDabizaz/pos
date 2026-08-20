"use client";

import { useId, useState } from "react";

type PasswordInputProps = {
  autoComplete?: string;
  hasError?    : boolean;
  id?          : string;
  minLength?   : number;
  onChange     : (value: string) => void;
  placeholder? : string;
  value        : string;
};

export default function PasswordInput({
  autoComplete,
  hasError = false,
  id,
  minLength,
  onChange,
  placeholder,
  value,
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        autoComplete={autoComplete}
        className={`w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none transition-colors focus:ring-2 ${
          hasError
            ? "border-status-danger-border focus:border-status-danger-border focus:ring-status-danger-border/20"
            : "border-border focus:border-ring focus:ring-ring/20"
        }`}
        id={inputId}
        minLength={minLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || '********'}
        type={isVisible ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setIsVisible((previous) => !previous)}
        tabIndex={-1}
        type="button"
      >
        {isVisible ? (
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.5A9.5 9.5 0 0 1 12 5c5.5 0 9 5 9 7-.4.9-1.4 2.3-2.9 3.5M6.3 6.9C4.3 8.2 2.8 10.1 2 12c1.7 3.5 5.2 7 10 7 1.2 0 2.3-.2 3.4-.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M2 12c1.7-3.5 5.2-7 10-7s8.3 3.5 10 7c-1.7 3.5-5.2 7-10 7s-8.3-3.5-10-7z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
