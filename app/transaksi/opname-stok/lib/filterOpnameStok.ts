import type { OpnameStok, OpnameStokFilter } from "@/app/transaksi/opname-stok/lib/types";
import { matchesSearch } from "@/lib/textSearch";

export function filterOpnameStok(items: OpnameStok[], filter: OpnameStokFilter): OpnameStok[] {
  return items.filter((item) => {
    if (!matchesSearch([item.kodeopname, item.namalokasi], filter.query)) return false;
    if (filter.tanggalDari && item.tanggal < filter.tanggalDari) return false;
    if (filter.tanggalSampai && item.tanggal > filter.tanggalSampai) return false;
    if (filter.status !== "SEMUA" && item.status !== filter.status) return false;

    return true;
  });
}
