import type { CSSProperties, ReactNode } from "react";

export type ComboGridColumn<T extends object> = {
  key          : keyof T;
  label        : string;
  width       ?: CSSProperties["width"];
  align       ?: "left" | "center" | "right";
  format      ?: "currency" | "quantity";
  render      ?: (value: T[keyof T], row: T, index: number) => ReactNode;
};

export type ComboGridProps<T extends object> = {
  columns            : ComboGridColumn<T>[];
  data               : T[];
  labelKey           : keyof T;
  valueKey           : keyof T;
  value             ?: T[keyof T];
  onChangeAction    ?: (value: T[keyof T] | undefined, row: T | undefined) => void;
  searchKeys        ?: (keyof T)[];
  placeholder       ?: string;
  label             ?: string;
  emptyMessage      ?: string;
  disabled          ?: boolean;
  required          ?: boolean;
  className        ?: string;
  inputClassName   ?: string;
  dropdownClassName?: string;
};
