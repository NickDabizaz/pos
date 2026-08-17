import PageSizeSelect from "@/components/DataTable/components/PageSizeSelect";

type PaginationControlsProps = {
  availablePageSizes: number[];
  currentPage       : number;
  firstVisibleRow   : number;
  lastVisibleRow    : number;
  pageSize          : number;
  totalPages        : number;
  totalRows         : number;
  changePageSize    : (pageSize: number) => void;
  goToNextPage      : () => void;
  goToPage          : (page: number) => void;
  goToPreviousPage  : () => void;
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
  const pageItems = createPageItems(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-5 border-t border-slate-200 bg-slate-50/70 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <PageSizeSelect
          onChange = {changePageSize}
          options  = {availablePageSizes}
          value    = {pageSize}
        />
        <span className="font-medium text-slate-600">baris per halaman</span>
        <span aria-hidden="true" className="hidden h-4 w-px bg-slate-300 sm:block" />
        <span className="text-slate-500">
          Menampilkan{" "}
          <strong className="font-semibold text-slate-700">
            {firstVisibleRow}-{lastVisibleRow}
          </strong>{" "}
          dari {totalRows}
        </span>
      </div>

      <nav
        aria-label="Navigasi halaman tabel"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0"
      >
        <button
          type="button"
          className="h-10 rounded-lg bg-slate-200/80 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-300/80 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentPage === 1}
          onClick={goToPreviousPage}
        >
          Sebelumnya
        </button>

        {pageItems.map((item) =>
          typeof item === "number" ? (
            <button
              aria-current={item === currentPage ? "page" : undefined}
              className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition ${
                item === currentPage
                  ? "bg-slate-950 text-white shadow-sm shadow-slate-950/20"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
              }`}
              key={item}
              onClick={() => goToPage(item)}
              type="button"
            >
              {item}
            </button>
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 min-w-10 items-center justify-center text-sm font-bold tracking-widest text-slate-400"
              key={item}
            >
              ...
            </span>
          ),
        )}

        <button
          type="button"
          className="h-10 rounded-lg bg-slate-200/80 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-300/80 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentPage === totalPages}
          onClick={goToNextPage}
        >
          Selanjutnya
        </button>
      </nav>
    </div>
  );
}

function createPageItems(currentPage: number, totalPages: number) {
  const visiblePages = new Set(
    [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(
      (page) => page >= 1 && page <= totalPages,
    ),
  );
  const sortedPages = Array.from(visiblePages).sort((a, b) => a - b);
  const items: Array<number | string> = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }

    items.push(page);
  });

  return items;
}
