"use client";

import { useMemo } from "react";

import DataTableContent from "@/components/DataTable/components/DataTableContent";
import PaginationControls from "@/components/DataTable/components/PaginationControls";
import { createCellFormatter } from "@/components/DataTable/lib/cellFormatter";
import type { DataTableProps } from "@/components/DataTable/lib/types";
import { useDataTablePagination } from "@/components/DataTable/lib/useDataTablePagination";
import { useDataTableSorting } from "@/components/DataTable/lib/useDataTableSorting";

export type {
  CellFormat,
  DataTableColumn,
  DataTableProps,
} from "@/components/DataTable/lib/types";

export default function DataTable<T extends object>({
  data,
  columns,
  rowKey,
  clickable       = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100, 200],
  locale          = "id-ID",
  currency        = "IDR",
  emptyMessage    = "Tidak ada data",
  className       = "",
  onRowClickAction,
  onRowDoubleClickAction,
}: DataTableProps<T>) {
  const sorting = useDataTableSorting(data, locale);
  const pagination = useDataTablePagination(
    sorting.sortedData,
    initialPageSize,
    pageSizeOptions,
  );
  const formatCell = useMemo(
    () => createCellFormatter(locale, currency),
    [currency, locale],
  );

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-card shadow-xs ring-1 ring-slate-950/5 ${className}`.trim()}
    >
      <DataTableContent
        clickable              = {clickable}
        columns                = {columns}
        dataSource             = {sorting.sortedData}
        emptyMessage           = {emptyMessage}
        formatCell             = {formatCell}
        onRowClickAction       = {onRowClickAction}
        onRowDoubleClickAction = {onRowDoubleClickAction}
        onSort                 = {sorting.toggleSort}
        pageSize               = {pagination.pageSize}
        rowKey                 = {rowKey}
        rows                   = {pagination.rows}
        sortDirection          = {sorting.sortDirection}
        sortKey                = {sorting.sortKey}
        startIndex             = {pagination.startIndex}
      />
      <PaginationControls
        availablePageSizes = {pagination.availablePageSizes}
        changePageSize     = {pagination.changePageSize}
        currentPage        = {pagination.currentPage}
        firstVisibleRow    = {pagination.firstVisibleRow}
        goToNextPage       = {pagination.goToNextPage}
        goToPage           = {pagination.goToPage}
        goToPreviousPage   = {pagination.goToPreviousPage}
        lastVisibleRow     = {pagination.lastVisibleRow}
        pageSize           = {pagination.pageSize}
        totalPages         = {pagination.totalPages}
        totalRows          = {data.length}
      />
    </div>
  );
}
