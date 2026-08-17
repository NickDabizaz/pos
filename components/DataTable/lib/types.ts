import type { CSSProperties, ReactNode } from "react";

export type DecimalCellFormat = {
  type         : "currency" | "quantity";
  decimalPlaces: number;
};

export type CellFormat      = "currency" | "quantity" | "text" | DecimalCellFormat;
export type ColumnAlignment = "center"   | "left"   | "right";

type ColumnPresentation = {
  width    : CSSProperties["width"];
  minWidth?: CSSProperties["width"];
  maxWidth?: CSSProperties["width"];
  align   ?: ColumnAlignment;
  hide    ?: boolean;
};

export type RowNumberColumn = ColumnPresentation & {
  type  : "rowNumber";
  label?: string;
};

type DataColumn<T extends object, K extends keyof T> = ColumnPresentation & {
  key      : K;
  label    : string;
  type    ?: "data";
  format  ?: Extract<T[K], number> extends never ? "text" : CellFormat;
  render  ?: (value: T[K], row: T, index: number) => ReactNode;
  sortable?: boolean;
};

export type DataTableColumn<T extends object> =
  | RowNumberColumn
  | {
      [K in keyof T]-?: DataColumn<T, K>;
    }[keyof T];

export type DataTableProps<T extends object> = {
  data             : T[];
  columns          : DataTableColumn<T>[];
  rowKey          ?: keyof T;
  clickable       ?: boolean;
  initialPageSize ?: number;
  pageSizeOptions ?: number[];
  locale          ?: string;
  currency        ?: string;
  emptyMessage    ?: string;
  className             ?: string;
  onRowClickAction      ?: (row: T | null) => void;
  onRowDoubleClickAction?: (row: T) => void;
};
