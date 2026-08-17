# DataTable module

`DataTable` is the global module for displaying an array of objects as a
structured table. It owns explicit column configuration, row numbering, value
formatting, hidden columns, sorting, interactive column resizing, clickable row
selection, and client-side pagination.
Use and extend this module for table requirements instead of creating a competing
table implementation.

## Public interface

Import only from the module root:

```tsx
import DataTable, {
  type DataTableColumn,
} from "@/components/DataTable";
```

Define every displayed field through `DataTableColumn<T>`:

```tsx
const columns: DataTableColumn<Product>[] = [
  { type: "rowNumber", width: "72px" },
  {
    key     : "name",
    label   : "Nama Produk",
    width   : "240px",
    minWidth: "180px",
    maxWidth: "480px",
  },
  {
    key   : "price",
    label : "Harga",
    width : "180px",
    align : "right",
    format: {
      type         : "currency",
      decimalPlaces: 2,
    },
  },
];
```

- `width` is required and accepts valid CSS widths such as `px`, `%`, or `rem`.
- `width` is the initial size; users can drag a header boundary to resize it.
- Only the active column changes width; other columns keep their measured widths.
- Without configuration, `minWidth` is derived from the header content and `maxWidth` from the DataTable viewport.
- Optional `minWidth` and `maxWidth` override those automatic limits and accept the same CSS widths as `width`.
- Remaining viewport space belongs to an internal filler column; wider tables scroll horizontally.
- Use `{ type: "rowNumber" }` for automatic numbering; its default label is `No.`.
- Use `format: "quantity"` or `format: "currency"` for numeric values with default precision.
- Use `format: { type: "quantity", decimalPlaces: 2 }` or `format: { type: "currency", decimalPlaces: 2 }` to set a fixed number of decimal places.
- Use `render` only when the built-in formats cannot represent the cell.
- Use `hide: true` to omit a configured column.
- Data columns are sortable by default; use `sortable: false` to disable sorting.
- Sorting uses the raw field value and runs before client-side pagination.
- `clickable` defaults to `true`; selected rows use the module's Tailwind state styles.
- Pagination is client-side and resets to page one when the data array changes.
- Row selection is single-row and toggles: clicking the selected row deselects it.
- `onRowClick?: (row: T | null) => void` fires on every row click with the row that just became selected, or `null` when the click deselected it. Ignored when `clickable` is `false`.
- `onRowDoubleClick?: (row: T) => void` fires on row double-click; only wired up when both `clickable` and `onRowDoubleClick` are set. Clicks always toggle selection immediately (no debounce) — a native double-click briefly toggles selection twice (select, then deselect) before `onRowDoubleClick` fires, which is an accepted trade-off for instant single-click feedback. Keyboard activation (Enter/Space) always toggles immediately.

## Structure and ownership

```text
DataTable/
├── index.tsx
├── AGENTS.md
├── components/
│   ├── ColumnResizeHandle.tsx
│   ├── DataTableContent.tsx
│   ├── PageSizeSelect.tsx
│   ├── PaginationControls.tsx
│   └── SortIndicator.tsx
└── lib/
    ├── cellFormatter.ts
    ├── types.ts
    ├── useDataTableColumnResize.ts
    ├── useDataTablePagination.ts
    └── useDataTableSorting.ts
```

- `index.tsx` owns the public interface and orchestrates the internal implementation.
- `components/` owns table and pagination rendering.
- `lib/` owns types, formatting, sorting, resizing, and pagination state.
- Keep styling in Tailwind CSS; inline styles are reserved for dynamic column widths.
- Keep property `:` characters vertically aligned within adjacent declarations and objects.
- Preserve generic typing; column keys must remain type-safe against the row object.
- Keep function props out of the `"use client"` entry interface unless they are genuine Server Actions. Custom column `render` functions require a Client Component caller.

## Verification

After changing this module, run:

```text
npx tsc --noEmit
npm run lint
npm run build
```

The work is complete when all three commands pass and imports still resolve through
`@/components/DataTable`.
