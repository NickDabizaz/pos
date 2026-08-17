import { matchesSearch } from "@/lib/textSearch";
import type { Pembelian, PembelianFilter } from "@/app/pembelian/lib/types";

export function filterPembelian(items: Pembelian[], filter: PembelianFilter): Pembelian[] {
  return items.filter((item) => {
    if (!matchesSearch([item.kodebeli, item.namasupplier], filter.query)) return false;
    if (filter.tanggalDari && item.tanggal < filter.tanggalDari) return false;
    if (filter.tanggalSampai && item.tanggal > filter.tanggalSampai) return false;

    return true;
  });
}
