import { matchesSearch } from "@/lib/textSearch";
import type { Lokasi } from "@/app/master/lokasi/lib/types";

export function filterLokasi(items: Lokasi[], query: string): Lokasi[] {
  return items.filter((item) =>
    matchesSearch([item.namalokasi, item.kodelokasi, item.keterangan], query),
  );
}
