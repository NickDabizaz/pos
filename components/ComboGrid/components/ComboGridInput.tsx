import type { ChangeEvent, KeyboardEvent, RefObject } from "react";

type ComboGridInputProps = {
  disabled      : boolean;
  dropdownId    : string;
  inputClassName: string;
  inputRef      : RefObject<HTMLInputElement | null>;
  isOpen        : boolean;
  label         : string | undefined;
  placeholder   : string;
  required      : boolean;
  value         : string;
  onChange      : (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown     : (event: KeyboardEvent<HTMLInputElement>) => void;
  onToggle      : () => void;
};

export default function ComboGridInput({
  disabled,
  dropdownId,
  inputClassName,
  inputRef,
  isOpen,
  label,
  placeholder,
  required,
  value,
  onChange,
  onKeyDown,
  onToggle,
}: ComboGridInputProps) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required ? <span className="ml-1 text-status-danger-fg">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <input
          aria-autocomplete="list"
          aria-controls={isOpen ? dropdownId : undefined}
          aria-expanded={isOpen}
          className={`h-11 w-full rounded-xl border border-border bg-card py-2.5 pr-12 pl-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border-strong focus:border-ring focus:ring-3 focus:ring-ring/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${inputClassName}`.trim()}
          disabled={disabled}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          role="combobox"
          value={value}
        />
        <button
          aria-label={isOpen ? "Tutup pilihan" : "Buka pilihan"}
          className="absolute inset-y-1 right-1 grid w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
          disabled={disabled}
          onClick={onToggle}
          tabIndex={-1}
          type="button"
        >
          <svg aria-hidden="true" className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
