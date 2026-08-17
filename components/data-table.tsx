"use client";

import {
  type CSSProperties,
  type ReactNode,
  useMemo,
  useState,
} from "react";

type ColumnAlignment = "left" | "center" | "right";

type DataTableColumnDefinition<T extends object, K extends keyof T> = {
  key: K;
  label: string;
  hide?: boolean;
  align?: ColumnAlignment;
  width?: CSSProperties["width"];
  render?: (value: T[K], row: T, index: number) => ReactNode;
};

export type DataTableColumn<T extends object> = {
  [K in keyof T]-?: DataTableColumnDefinition<T, K>;
}[keyof T];

export type DataTableProps<T extends object> = {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey?: keyof T;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  showRowNumber?: boolean;
  emptyMessage?: string;
  className?: string;
};

const alignmentClasses: Record<ColumnAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function normalizePageSizes(options: number[], initialPageSize: number) {
  return Array.from(
    new Set([initialPageSize, ...options].filter((size) => size > 0)),
  ).sort((a, b) => a - b);
}

function displayValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function resolveRowKey<T extends object>(
  row: T,
  rowKey: keyof T | undefined,
  absoluteIndex: number,
) {
  const record = row as Record<PropertyKey, unknown>;
  const value = rowKey ? row[rowKey] : record.id;

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return `row-${absoluteIndex}`;
}

export default function DataTable<T extends object>({
  data,
  columns,
  rowKey,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  showRowNumber = false,
  emptyMessage = "Tidak ada data",
  className = "",
}: DataTableProps<T>) {
  const safeInitialPageSize = initialPageSize > 0 ? initialPageSize : 10;
  const [pagination, setPagination] = useState({ data, page: 1 });
  const [pageSize, setPageSize] = useState(safeInitialPageSize);

  if (pagination.data !== data) {
    setPagination({ data, page: 1 });
  }

  const page = pagination.page;

  const visibleColumns = useMemo(
    () => columns.filter((column) => !column.hide),
    [columns],
  );
  const availablePageSizes = useMemo(
    () => normalizePageSizes(pageSizeOptions, safeInitialPageSize),
    [pageSizeOptions, safeInitialPageSize],
  );
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = data.slice(startIndex, startIndex + pageSize);
  const firstVisibleRow = data.length === 0 ? 0 : startIndex + 1;
  const lastVisibleRow = Math.min(startIndex + pageSize, data.length);

  function updatePage(nextPage: number | ((currentPage: number) => number)) {
    setPagination((current) => {
      const activePage = current.data === data ? current.page : 1;

      return {
        data,
        page:
          typeof nextPage === "function" ? nextPage(activePage) : nextPage,
      };
    });
  }

  function changePageSize(value: string) {
    setPageSize(Number(value));
    updatePage(1);
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {showRowNumber && (
                <th className="w-16 px-5 py-3.5 text-center">No.</th>
              )}
              {visibleColumns.map((column) => {
                const align = column.align ?? "left";

                return (
                  <th
                    key={String(column.key)}
                    className={`whitespace-nowrap px-5 py-3.5 ${alignmentClasses[align]}`}
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentRows.length > 0 ? (
              currentRows.map((row, rowIndex) => {
                const absoluteIndex = startIndex + rowIndex;

                return (
                  <tr
                    key={resolveRowKey(row, rowKey, absoluteIndex)}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {showRowNumber && (
                      <td className="whitespace-nowrap px-5 py-4 text-center text-slate-500">
                        {absoluteIndex + 1}
                      </td>
                    )}
                    {visibleColumns.map((column) => {
                      const align = column.align ?? "left";
                      const value = row[column.key];

                      return (
                        <td
                          key={String(column.key)}
                          className={`px-5 py-4 ${alignmentClasses[align]}`}
                          style={{ width: column.width }}
                        >
                          {column.render
                            ? column.render(value, row, absoluteIndex)
                            : displayValue(value)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-5 py-12 text-center text-slate-500"
                  colSpan={Math.max(
                    1,
                    visibleColumns.length + (showRowNumber ? 1 : 0),
                  )}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>
            Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {data.length} data
          </span>
          <label className="flex items-center gap-2">
            <span>Baris</span>
            <select
              aria-label="Jumlah baris per halaman"
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              onChange={(event) => changePageSize(event.target.value)}
              value={pageSize}
            >
              {availablePageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <nav
          aria-label="Navigasi halaman tabel"
          className="flex items-center gap-2"
        >
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPage === 1}
            onClick={() => updatePage((value) => Math.max(1, value - 1))}
          >
            Sebelumnya
          </button>
          <span className="min-w-28 px-2 text-center text-sm text-slate-600">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPage === totalPages}
            onClick={() =>
              updatePage((value) => Math.min(totalPages, value + 1))
            }
          >
            Berikutnya
          </button>
        </nav>
      </div>
    </div>
  );
}
