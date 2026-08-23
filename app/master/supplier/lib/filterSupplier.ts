import { matchesSearch } from "@/lib/textSearch";
import type { Supplier } from "@/app/master/supplier/lib/types";

export function filterSupplier(items: Supplier[], query: string): Supplier[] {
  return items.filter((item) =>
    matchesSearch(
      [item.namasupplier, item.kodesupplier, item.kontakperson, item.telepon, item.email, item.alamat],
      query,
    ),
  );
}
