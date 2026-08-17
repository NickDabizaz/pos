"use client";

import { useMemo, useState } from "react";

export type SortDirection = "ascending" | "descending";

type SortState<T extends object> = {
  key      : keyof T;
  direction: SortDirection;
};

export function useDataTableSorting<T extends object>(
  data: T[],
  locale: string,
) {
  const [sortState, setSortState] = useState<SortState<T> | null>(null);
  const collator = useMemo(
    () => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }),
    [locale],
  );
  const sortedData = useMemo(
    () => sortRows(data, sortState, collator),
    [collator, data, sortState],
  );

  function toggleSort(key: keyof T) {
    setSortState((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }

  return {
    sortedData,
    sortKey      : sortState?.key ?? null,
    sortDirection: sortState?.direction ?? null,
    toggleSort,
  };
}

function sortRows<T extends object>(
  data: T[],
  sortState: SortState<T> | null,
  collator: Intl.Collator,
) {
  if (!sortState) {
    return data;
  }

  const directionMultiplier = sortState.direction === "ascending" ? 1 : -1;

  return data
    .map((row, originalIndex) => ({ originalIndex, row }))
    .sort((left, right) => {
      const comparison = compareValues(
        left.row[sortState.key],
        right.row[sortState.key],
        collator,
      );

      return comparison === 0
        ? left.originalIndex - right.originalIndex
        : comparison * directionMultiplier;
    })
    .map(({ row }) => row);
}

function compareValues(
  left: unknown,
  right: unknown,
  collator: Intl.Collator,
) {
  if (left === right) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  return collator.compare(String(left), String(right));
}
