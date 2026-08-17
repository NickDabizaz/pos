import { useEffect, useRef } from "react";

import type { ComboGridColumn } from "@/components/ComboGrid/lib/types";

type ComboGridTableProps<T extends object> = {
  columns         : ComboGridColumn<T>[];
  currency        : string;
  emptyMessage    : string;
  highlightedIndex: number;
  locale          : string;
  onHoverRow     ?: (index: number) => void;
  onSelect        : (row: T) => void;
  rows            : T[];
  selectedValue   : T[keyof T] | undefined;
  valueKey        : keyof T;
};

const alignmentClasses = {
  center: "text-center",
  left  : "text-left",
  right : "text-right",
};

export default function ComboGridTable<T extends object>({
  columns,
  currency,
  emptyMessage,
  highlightedIndex,
  locale,
  onHoverRow,
  onSelect,
  rows,
  selectedValue,
  valueKey,
}: ComboGridTableProps<T>) {
  const activeRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex]);

  return (
    <div className="custom-scrollbar max-h-[329px] overflow-auto overscroll-contain">
      <table
        aria-multiselectable = "false"
        className            = "w-full min-w-max border-collapse text-sm text-foreground"
        role                 = "listbox"
      >
        <colgroup>
          {columns.map((column) => (
            <col key={String(column.key)} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 border-b border-table-header-border bg-table-header text-[11px] font-semibold uppercase tracking-wider text-table-header-fg">
          <tr>
            {columns.map((column) => (
              <th
                className={`whitespace-nowrap px-4 py-3 ${alignmentClasses[column.align ?? "left"]}`}
                key={String(column.key)}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-table-border bg-card">
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-4 py-10 text-center text-sm text-muted-foreground"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const isSelected    = Object.is(row[valueKey], selectedValue);
              const isHighlighted = index === highlightedIndex;

              return (
                <tr
                  aria-selected = {isSelected || isHighlighted}
                  className     = {`cursor-pointer transition-colors ${
                    isHighlighted
                      ? "bg-table-row-selected font-medium text-foreground"
                      : isSelected
                        ? "bg-table-row-selected/60 text-foreground"
                        : "text-slate-700 hover:bg-table-row-hover"
                  }`}
                  id            = {`combo-grid-row-${index}`}
                  key           = {getRowKey(row, valueKey, index)}
                  onClick       = {() => onSelect(row)}
                  onMouseEnter  = {() => onHoverRow?.(index)}
                  ref           = {isHighlighted ? activeRowRef : null}
                  role          = "option"
                >
                  {columns.map((column) => (
                    <td
                      className={`h-12 whitespace-nowrap px-4 py-3 ${alignmentClasses[column.align ?? "left"]}`}
                      key={String(column.key)}
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : formatCell(
                            row[column.key],
                            column.format,
                            locale,
                            currency,
                          )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(
  value: unknown,
  format: ComboGridColumn<object>["format"],
  locale: string,
  currency: string,
) {
  if (typeof value !== "number" || !format) {
    return String(value ?? "");
  }

  if (format === "currency") {
    return new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: "currency",
    }).format(value);
  }

  return new Intl.NumberFormat(locale).format(value);
}

function getRowKey<T extends object>(row: T, valueKey: keyof T, index: number) {
  const value = row[valueKey];
  return typeof value === "number" || typeof value === "string"
    ? value
    : `combo-grid-row-${index}`;
}
