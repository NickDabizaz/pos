import type { ComboGridColumn } from "@/components/ComboGrid/lib/types";

type ComboGridTableProps<T extends object> = {
  columns        : ComboGridColumn<T>[];
  currency       : string;
  emptyMessage   : string;
  locale         : string;
  rows           : T[];
  selectedValue  : T[keyof T] | undefined;
  valueKey       : keyof T;
  onSelect       : (row: T) => void;
};

const alignmentClasses = {
  left  : "text-left",
  center: "text-center",
  right : "text-right",
};

export default function ComboGridTable<T extends object>({
  columns,
  currency,
  emptyMessage,
  locale,
  rows,
  selectedValue,
  valueKey,
  onSelect,
}: ComboGridTableProps<T>) {
  return (
    <div className="max-h-[329px] overflow-auto overscroll-contain">
      <table className="w-full min-w-max border-collapse text-sm text-foreground">
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
              <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const isSelected = Object.is(row[valueKey], selectedValue);

              return (
                <tr
                  aria-selected={isSelected}
                  className={`cursor-pointer transition-colors focus-within:bg-table-row-selected hover:bg-table-row-hover ${isSelected ? "bg-table-row-selected" : ""}`}
                  key={getRowKey(row, valueKey, index)}
                  onClick={() => onSelect(row)}
                >
                  {columns.map((column) => (
                    <td className={`h-12 whitespace-nowrap px-4 py-3 ${alignmentClasses[column.align ?? "left"]}`} key={String(column.key)}>
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : formatCell(row[column.key], column.format, locale, currency)}
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
