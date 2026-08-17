import { type KeyboardEvent, useState } from "react";

import ColumnResizeHandle from "@/components/DataTable/components/ColumnResizeHandle";
import SortIndicator from "@/components/DataTable/components/SortIndicator";
import type { CellFormatter } from "@/components/DataTable/lib/cellFormatter";
import type {
  ColumnAlignment,
  DataTableColumn,
  RowNumberColumn,
} from "@/components/DataTable/lib/types";
import { useDataTableColumnResize } from "@/components/DataTable/lib/useDataTableColumnResize";
import type { SortDirection } from "@/components/DataTable/lib/useDataTableSorting";

type RowIdentifier = number | string;

type DataTableContentProps<T extends object> = {
  clickable    : boolean;
  columns      : DataTableColumn<T>[];
  dataSource   : T[];
  emptyMessage : string;
  formatCell   : CellFormatter;
  onSort       : (key: keyof T) => void;
  rowKey      ?: keyof T;
  rows         : T[];
  sortDirection: SortDirection | null;
  sortKey      : keyof T | null;
  startIndex   : number;
};

type RowSelection<T> = {
  clickable  : boolean;
  dataSource : T[];
  selectedRow: RowIdentifier | null;
};

const alignmentClasses: Record<ColumnAlignment, string> = {
  left  : "text-left",
  center: "text-center",
  right : "text-right",
};

const justificationClasses: Record<ColumnAlignment, string> = {
  left  : "justify-start",
  center: "justify-center",
  right : "justify-end",
};

export default function DataTableContent<T extends object>({
  clickable,
  columns,
  dataSource,
  emptyMessage,
  formatCell,
  onSort,
  rowKey,
  rows,
  sortDirection,
  sortKey,
  startIndex,
}: DataTableContentProps<T>) {
  const visibleColumns = columns.filter((column) => !column.hide);
  const [selectedRow, selectRow] = useRowSelection(dataSource, clickable);
  const {
    columnWidths,
    tableRef,
    tableWidth,
    continueResize,
    resizeWithKeyboard,
    startResize,
    stopResize,
  } = useDataTableColumnResize();

  return (
    <div className="relative max-w-full overflow-x-auto overscroll-x-contain">
      <table
        className="min-w-full table-fixed border-collapse text-sm text-slate-700"
        ref={tableRef}
        style={
          tableWidth !== null
            ? { width: `max(100%, ${tableWidth}px)` }
            : undefined
        }
      >
        <colgroup>
          {visibleColumns.map((column) => {
            const columnId = getColumnId(column);

            return (
              <col
                key={columnId}
                style={{
                  width: columnWidths[columnId] ?? column.width,
                }}
              />
            );
          })}
          <col style={tableWidth === null ? { width: 0 } : undefined} />
        </colgroup>
        <thead className="border-y border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            {visibleColumns.map((column) => {
              const columnId = getColumnId(column);
              const columnLabel = getColumnLabel(column);
              const isSortable = canSortColumn(column);
              const activeDirection =
                isSortable && column.key === sortKey ? sortDirection : null;
              const resizeLimits = {
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
              };

              return (
                <th
                  aria-sort={
                    isSortable ? (activeDirection ?? "none") : undefined
                  }
                  className={`relative whitespace-nowrap bg-slate-100 px-5 py-3.5 ${alignmentClasses[getColumnAlignment(column)]}`}
                  data-column-id={columnId}
                  key={columnId}
                >
                  {isSortable ? (
                    <button
                      className={`group flex w-full min-w-0 items-center overflow-hidden rounded-sm transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${justificationClasses[getColumnAlignment(column)]}`}
                      onClick={() => onSort(column.key)}
                      type="button"
                    >
                      <span
                        className="inline-flex shrink-0 items-center gap-1.5"
                        data-column-content
                      >
                        <span>{column.label}</span>
                        <SortIndicator direction={activeDirection} />
                      </span>
                    </button>
                  ) : (
                    <span
                      className="inline-block max-w-full truncate align-middle"
                      data-column-content
                    >
                      {columnLabel}
                    </span>
                  )}
                  <ColumnResizeHandle
                    label           = {columnLabel}
                    onKeyDown       = {(event) =>
                      resizeWithKeyboard(event, columnId, resizeLimits)
                    }
                    onPointerCancel = {stopResize}
                    onPointerDown   = {(event) =>
                      startResize(event, columnId, resizeLimits)
                    }
                    onPointerMove   = {continueResize}
                    onPointerUp     = {stopResize}
                  />
                </th>
              );
            })}
            <th aria-hidden="true" className="bg-slate-100 p-0" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-5 py-12 text-center text-slate-500"
                colSpan={Math.max(1, visibleColumns.length + 1)}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => {
              const absoluteIndex = startIndex + rowIndex;
              const identifier = getRowIdentifier(row, rowKey, absoluteIndex);
              const isSelected = clickable && selectedRow === identifier;
              const activateRow = () => selectRow(identifier);

              return (
                <tr
                  aria-selected={clickable ? isSelected : undefined}
                  className={getRowClassName(clickable, isSelected)}
                  key={identifier}
                  onClick={clickable ? activateRow : undefined}
                  onKeyDown={
                    clickable
                      ? (event) => selectRowWithKeyboard(event, activateRow)
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={getColumnId(column)}
                      className={`px-5 py-4 ${alignmentClasses[getColumnAlignment(column)]}`}
                    >
                      {isRowNumberColumn(column)
                        ? absoluteIndex + 1
                        : column.render
                          ? column.render(
                              row[column.key],
                              row,
                              absoluteIndex,
                            )
                          : formatCell(row[column.key], column.format)}
                    </td>
                  ))}
                  <td aria-hidden="true" className="p-0" />
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function useRowSelection<T>(dataSource: T[], clickable: boolean) {
  const [selection, setSelection] = useState<RowSelection<T>>({
    clickable,
    dataSource,
    selectedRow: null,
  });

  if (
    selection.dataSource !== dataSource ||
    selection.clickable !== clickable
  ) {
    setSelection({ clickable, dataSource, selectedRow: null });
  }

  function selectRow(selectedRow: RowIdentifier) {
    setSelection({ clickable, dataSource, selectedRow });
  }

  return [selection.selectedRow, selectRow] as const;
}

function isRowNumberColumn<T extends object>(
  column: DataTableColumn<T>,
): column is RowNumberColumn {
  return column.type === "rowNumber";
}

function canSortColumn<T extends object>(
  column: DataTableColumn<T>,
): column is Exclude<DataTableColumn<T>, RowNumberColumn> {
  return !isRowNumberColumn(column) && column.sortable !== false;
}

function getColumnId<T extends object>(column: DataTableColumn<T>) {
  return isRowNumberColumn(column)
    ? "__row-number__"
    : String(column.key);
}

function getColumnLabel<T extends object>(column: DataTableColumn<T>) {
  return isRowNumberColumn(column) ? (column.label ?? "No.") : column.label;
}

function getColumnAlignment<T extends object>(
  column: DataTableColumn<T>,
): ColumnAlignment {
  return column.align ?? (isRowNumberColumn(column) ? "center" : "left");
}

function getRowIdentifier<T extends object>(
  row: T,
  rowKey: keyof T | undefined,
  absoluteIndex: number,
): RowIdentifier {
  const fallbackId = (row as Record<PropertyKey, unknown>).id;
  const value = rowKey ? row[rowKey] : fallbackId;

  return typeof value === "string" || typeof value === "number"
    ? value
    : `row-${absoluteIndex}`;
}

function getRowClassName(clickable: boolean, isSelected: boolean) {
  if (!clickable) {
    return undefined;
  }

  if (isSelected) {
    return "cursor-pointer bg-slate-200 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500";
  }

  return "cursor-pointer transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500";
}

function selectRowWithKeyboard(
  event: KeyboardEvent<HTMLTableRowElement>,
  selectRow: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  selectRow();
}
