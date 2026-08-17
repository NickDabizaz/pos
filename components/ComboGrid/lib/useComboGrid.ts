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
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  return {
    displayValue: selectedRow ? String(selectedRow[labelKey] ?? "") : query,
    isOpen,
    query,
    rows,
    setIsOpen,
    setQuery,
  };
}
