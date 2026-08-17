import { useMemo, useState } from "react";

type UseComboGridOptions<T extends object> = {
  data      : T[];
  labelKey  : keyof T;
  searchKeys: (keyof T)[];
  value     : T[keyof T] | undefined;
  valueKey  : keyof T;
};

export function useComboGrid<T extends object>({
  data,
  labelKey,
  searchKeys,
  value,
  valueKey,
}: UseComboGridOptions<T>) {
  const [isOpen, setIsOpen]                     = useState(false);
  const [query, setQuery]                       = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedRow = useMemo(
    () => data.find((row) => Object.is(row[valueKey], value)),
    [data, value, valueKey],
  );

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");

    if (!normalizedQuery) {
      return data;
    }

    return data.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? "")
          .toLocaleLowerCase("id-ID")
          .includes(normalizedQuery),
      ),
    );
  }, [data, query, searchKeys]);

  function openDropdown() {
    setIsOpen(true);

    if (rows.length > 0) {
      const selectedIndex = rows.findIndex((row) =>
        Object.is(row[valueKey], value),
      );

      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }

  function closeDropdown() {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    setIsOpen(true);
    setHighlightedIndex(0);
  }

  function navigateNext() {
    if (!isOpen) {
      openDropdown();
      return;
    }

    if (rows.length === 0) {
      return;
    }

    setHighlightedIndex((current) =>
      current < 0 || current >= rows.length - 1 ? 0 : current + 1,
    );
  }

  function navigatePrevious() {
    if (!isOpen) {
      openDropdown();
      return;
    }

    if (rows.length === 0) {
      return;
    }

    setHighlightedIndex((current) =>
      current <= 0 ? rows.length - 1 : current - 1,
    );
  }

  return {
    closeDropdown,
    displayValue: selectedRow ? String(selectedRow[labelKey] ?? "") : query,
    highlightedIndex,
    isOpen,
    navigateNext,
    navigatePrevious,
    openDropdown,
    query,
    rows,
    setHighlightedIndex,
    setIsOpen,
    setQuery,
    updateQuery,
  };
}
