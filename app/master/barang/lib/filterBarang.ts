import type { Barang } from "@/app/master/barang/lib/types";

export function filterBarang(items: Barang[], query: string): Barang[] {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter(
    (item) =>
      normalizedQuery === "" ||
      item.namabarang.toLowerCase().includes(normalizedQuery) ||
      item.kodebarang.toLowerCase().includes(normalizedQuery),
  );
}
