import type { Barang } from "@/app/modules/master/barang/lib/types";

export function filterBarang(items: Barang[], query: string, kategori: string): Barang[] {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesQuery =
      normalizedQuery === "" ||
      item.namabarang.toLowerCase().includes(normalizedQuery) ||
      item.kodebarang.toLowerCase().includes(normalizedQuery);
    const matchesKategori = kategori === "" || item.kategori === kategori;

    return matchesQuery && matchesKategori;
  });
}
