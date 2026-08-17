import type { ReactNode } from "react";

import type { CellFormat } from "@/components/DataTable/lib/types";

export type CellFormatter = (value: unknown, format?: CellFormat) => ReactNode;

export function createCellFormatter(
  locale  : string,
  currency: string,
): CellFormatter {
  const quantityFormatter = new Intl.NumberFormat(locale);
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  const configuredFormatters = new Map<string, Intl.NumberFormat>();

  return (value, format = "text") => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (typeof value === "number" && format === "currency") {
      return currencyFormatter.format(value);
    }

    if (typeof value === "number" && format === "quantity") {
      return quantityFormatter.format(value);
    }

    if (typeof value === "number" && typeof format === "object") {
      const decimalPlaces = normalizeDecimalPlaces(format.decimalPlaces);
      const cacheKey      = `${format.type}-${decimalPlaces}`;
      let   formatter     = configuredFormatters.get(cacheKey);

      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, {
          style                : format.type === "currency" ? "currency": "decimal",
          currency             : format.type === "currency" ? currency  : undefined,
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        });
        configuredFormatters.set(cacheKey, formatter);
      }

      return formatter.format(value);
    }

    return String(value);
  };
}

function normalizeDecimalPlaces(decimalPlaces: number) {
  return Math.min(20, Math.max(0, Math.trunc(decimalPlaces)));
}
