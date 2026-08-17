import { type KeyboardEvent, useEffect, useRef, useState } from "react";

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
  clickable        : boolean;
  columns          : DataTableColumn<T>[];
  dataSource       : T[];
  emptyMessage     : string;
  formatCell       : CellFormatter;
  onRowClick      ?: (row: T | null) => void;
  onRowDoubleClick?: (row: T) => void;
  onSort           : (key: keyof T) => void;
  pageSize        ?: number;
  rowKey          ?: keyof T;
  rows             : T[];
  sortDirection    : SortDirection | null;
  sortKey          : keyof T | null;
  startIndex       : number;
};

type RowSelection<T> = {
  clickable  : boolean;
  dataSource : T[];
  selectedRow: RowIdentifier | null;
};

type PendingClick = {
  identifier: RowIdentifier;
  timeoutId : ReturnType<typeof setTimeout>;
};

const DOUBLE_CLICK_WINDOW_MS = 250;

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
  onRowClick,
  onRowDoubleClick,
  onSort,
  pageSize,
  rowKey,
  rows,
  sortDirection,
  sortKey,
  startIndex,
}: DataTableContentProps<T>) {
  const visibleColumns = columns.filter((column) => !column.hide);
  const [selectedRow, selectRow] = useRowSelection(dataSource, clickable);
  const pendingClickRef = useRef<PendingClick | null>(null);

  useEffect(() => {
    return () => {
      if (pendingClickRef.current) {
        clearTimeout(pendingClickRef.current.timeoutId);
      }
    };
  }, []);

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
    <div className="custom-scrollbar relative max-w-full overflow-x-auto overscroll-x-contain">
      <table
        className="min-w-full table-fixed border-collapse text-sm text-foreground"
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
        <thead className="border-b border-table-header-border bg-table-header text-[11px] font-semibold uppercase tracking-wider text-table-header-fg">
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
                  className={`relative whitespace-nowrap bg-table-header px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-table-header-fg ${alignmentClasses[getColumnAlignment(column)]}`}
                  data-column-id={columnId}
                  key={columnId}
                >
                  {isSortable ? (
                    <button
                      className={`group -mx-1.5 flex w-[calc(100%+0.75rem)] min-w-0 items-center overflow-hidden rounded-md px-1.5 py-1 text-table-header-fg transition-colors hover:bg-slate-200/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${justificationClasses[getColumnAlignment(column)]}`}
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
                      className="inline-block max-w-full truncate align-middle text-table-header-fg"
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
            <th aria-hidden="true" className="bg-table-header p-0" />
          </tr>
        </thead>
        <tbody className="divide-y divide-table-border bg-card">
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-4 py-12 text-center text-sm text-muted-foreground"
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
              const activateRow = () => {
                const nextIdentifier = isSelected ? null : identifier;
                selectRow(nextIdentifier);
                onRowClick?.(nextIdentifier === null ? null : row);
              };
              const handleClick = () => {
                if (!onRowDoubleClick) {
                  activateRow();
                  return;
                }

                const pending = pendingClickRef.current;

                if (pending) {
                  clearTimeout(pending.timeoutId);

                  if (pending.identifier === identifier) {
                    pendingClickRef.current = null;
                    return;
                  }
                }

                pendingClickRef.current = {
                  identifier,
                  timeoutId: setTimeout(() => {
                    pendingClickRef.current = null;
                    activateRow();
                  }, DOUBLE_CLICK_WINDOW_MS),
                };
              };
              const handleDoubleClick = () => onRowDoubleClick?.(row);

              return (
                <tr
                  aria-selected={clickable ? isSelected : undefined}
                  className={getRowClassName(clickable, isSelected)}
                  key={identifier}
                  onClick={clickable ? handleClick : undefined}
                  onDoubleClick={clickable && onRowDoubleClick ? handleDoubleClick : undefined}
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
                      className={`px-4 py-3 text-sm text-slate-700 ${alignmentClasses[getColumnAlignment(column)]} ${
                        isRowNumberColumn(column)
                          ? "font-mono text-xs text-muted-foreground"
                          : ""
                      }`}
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
          {pageSize !== undefined && rows.length > 0 && rows.length < pageSize && (
            Array.from({ length: pageSize - rows.length }).map((_, spacerIndex) => (
              <tr
                aria-hidden="true"
                className="pointer-events-none select-none"
                key={`spacer-${spacerIndex}`}
              >
                {visibleColumns.map((column) => (
                  <td
                    className={`px-4 py-3 text-sm text-transparent ${alignmentClasses[getColumnAlignment(column)]}`}
                    key={getColumnId(column)}
                  >
                    &nbsp;
                  </td>
                ))}
                <td aria-hidden="true" className="p-0" />
              </tr>
            ))
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

  function selectRow(selectedRow: RowIdentifier | null) {
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
    return "transition-colors duration-150";
  }

  if (isSelected) {
    return "cursor-pointer bg-table-row-selected font-medium text-foreground transition-colors duration-150 hover:bg-table-row-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";
  }

  return "cursor-pointer transition-colors duration-150 hover:bg-table-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";
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
