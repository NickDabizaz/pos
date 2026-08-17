import { matchesSearch } from "@/lib/textSearch";
import type { Barang } from "@/app/master/barang/lib/types";

export function filterBarang(items: Barang[], query: string): Barang[] {
  return items.filter((item) => matchesSearch([item.namabarang, item.kodebarang], query));
}
