import { useEffect, useId, useRef } from "react";

import ComboGridInput from "@/components/ComboGrid/components/ComboGridInput";
import ComboGridTable from "@/components/ComboGrid/components/ComboGridTable";
import type { ComboGridProps } from "@/components/ComboGrid/lib/types";
import { useComboGrid } from "@/components/ComboGrid/lib/useComboGrid";

export type {
  ComboGridColumn,
  ComboGridProps,
} from "@/components/ComboGrid/lib/types";

export default function ComboGrid<T extends object>({
  columns,
  data,
  labelKey,
  valueKey,
  value,
  onChangeAction,
  searchKeys,
  placeholder       = "Cari atau pilih data...",
  label,
  emptyMessage      = "Data tidak ditemukan",
  disabled          = false,
  required          = false,
  className         = "",
  inputClassName    = "",
  dropdownClassName = "",
}: ComboGridProps<T>) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const dropdownId     = useId();
  const searchableKeys = searchKeys ?? [labelKey];
  const {
    displayValue,
    isOpen,
    query,
    rows,
    setIsOpen,
    setQuery,
  } = useComboGrid({
    data,
    labelKey,
    searchKeys: searchableKeys,
    value,
    valueKey,
  });

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [setIsOpen]);

  function selectRow(row: T) {
    onChangeAction?.(row[valueKey], row);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className={`relative ${className}`.trim()} ref={containerRef}>
      <ComboGridInput
        disabled       = {disabled}
        dropdownId     = {dropdownId}
        inputClassName = {inputClassName}
        inputRef       = {inputRef}
        isOpen         = {isOpen}
        label          = {label}
        onChange = {(event) => {
          const nextQuery = event.target.value;

          setQuery(nextQuery);
          setIsOpen(true);

          if (!nextQuery) {
            onChangeAction?.(undefined, undefined);
          }
        }}
        onKeyDown = {(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        onToggle = {() => {
          setQuery("");
          setIsOpen((open) => !open);
        }}
        placeholder    = {placeholder}
        required       = {required}
        value          = {isOpen ? query : displayValue}
      />

      {isOpen ? (
        <div className={`absolute z-20 mt-2 w-full min-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-slate-950/10 ${dropdownClassName}`.trim()} id={dropdownId}>
          <ComboGridTable
            columns        = {columns}
            currency       = "IDR"
            emptyMessage   = {emptyMessage}
            locale         = "id-ID"
            onSelect       = {selectRow}
            rows           = {rows}
            selectedValue  = {value}
            valueKey       = {valueKey}
          />
        </div>
      ) : null}
    </div>
  );
}
