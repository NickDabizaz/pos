"use client";

import { useState } from "react";

import PageSizeSelect from "@/components/DataTable/components/PageSizeSelect";

type PaginationControlsProps = {
  availablePageSizes: number[];
  changePageSize    : (pageSize: number) => void;
  currentPage       : number;
  firstVisibleRow   : number;
  goToNextPage      : () => void;
  goToPage          : (page: number) => void;
  goToPreviousPage  : () => void;
  lastVisibleRow    : number;
  pageSize          : number;
  totalPages        : number;
  totalRows         : number;
};

export default function PaginationControls({
  availablePageSizes,
  currentPage,
  firstVisibleRow,
  lastVisibleRow,
  pageSize,
  totalPages,
  totalRows,
  changePageSize,
  goToNextPage,
  goToPage,
  goToPreviousPage,
}: PaginationControlsProps) {
  const [syncedPage, setSyncedPage] = useState(currentPage);
  const [typedPage, setTypedPage]   = useState(String(currentPage));

  if (syncedPage !== currentPage) {
    setSyncedPage(currentPage);
    setTypedPage(String(currentPage));
  }

  function handlePageSubmit() {
    const parsed = Number.parseInt(typedPage, 10);

    if (Number.isNaN(parsed)) {
      setTypedPage(String(currentPage));
      return;
    }

    const clamped = Math.min(Math.max(1, parsed), totalPages);
    setTypedPage(String(clamped));

    if (clamped !== currentPage) {
      goToPage(clamped);
    }
  }

  return (
    <div className="flex flex-col gap-3.5 border-t border-table-header-border bg-table-header/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-muted-foreground">
        <PageSizeSelect
          onChange = {changePageSize}
          options  = {availablePageSizes}
          value    = {pageSize}
        />
        <span className="font-medium text-table-header-fg">baris per halaman</span>
        <span aria-hidden="true" className="hidden h-3.5 w-px bg-border sm:block" />
        <span>
          Menampilkan{" "}
          <strong className="font-semibold text-foreground tabular-nums">
            {firstVisibleRow}-{lastVisibleRow}
          </strong>{" "}
          dari{" "}
          <strong className="font-semibold text-foreground tabular-nums">
            {totalRows}
          </strong>
        </span>
      </div>

      <nav
        aria-label="Navigasi halaman tabel"
        className="flex items-center gap-1.5"
      >
        <button
          aria-label = "Halaman pertama"
          className  = "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition-all hover:border-border-strong hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-card"
          disabled   = {currentPage === 1}
          onClick    = {() => goToPage(1)}
          title      = "Halaman pertama"
          type       = "button"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24">
            <path
              d="m11 17-5-5 5-5m7 10-5-5 5-5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        <button
          aria-label = "Halaman sebelumnya"
          className  = "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition-all hover:border-border-strong hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-card"
          disabled   = {currentPage === 1}
          onClick    = {goToPreviousPage}
          title      = "Halaman sebelumnya"
          type       = "button"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24">
            <path
              d="m15 19-7-7 7-7"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 text-xs shadow-xs transition-colors focus-within:border-border-strong focus-within:ring-1 focus-within:ring-slate-950/5">
          <input
            aria-label  = "Ketik nomor halaman"
            className   = "h-6 w-7 rounded bg-secondary/60 px-0.5 text-center font-bold text-foreground tabular-nums transition-colors hover:bg-secondary focus:bg-secondary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            max         = {totalPages}
            min         = {1}
            onBlur      = {handlePageSubmit}
            onChange    = {(event) => setTypedPage(event.target.value)}
            onKeyDown   = {(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handlePageSubmit();
              }
            }}
            type        = "number"
            value       = {typedPage}
          />
          <span className="pr-0.5 font-medium text-muted-foreground">
            / <strong className="font-semibold text-foreground tabular-nums">{totalPages}</strong>
          </span>
        </div>

        <button
          aria-label = "Halaman selanjutnya"
          className  = "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition-all hover:border-border-strong hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-card"
          disabled   = {currentPage === totalPages}
          onClick    = {goToNextPage}
          title      = "Halaman selanjutnya"
          type       = "button"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24">
            <path
              d="m9 5 7 7-7 7"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        <button
          aria-label = "Halaman terakhir"
          className  = "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition-all hover:border-border-strong hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-card"
          disabled   = {currentPage === totalPages}
          onClick    = {() => goToPage(totalPages)}
          title      = "Halaman terakhir"
          type       = "button"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24">
            <path
              d="m6 17 5-5-5-5m7 10 5-5-5-5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </nav>
    </div>
  );
}
