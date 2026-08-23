import type { PembelianFilter } from "@/app/transaksi/pembelian/lib/types";
import type { Pembelian } from "@/lib/server/pembelian/types";
import { matchesSearch } from "@/lib/textSearch";

export function filterPembelian(items: Pembelian[], filter: PembelianFilter): Pembelian[] {
  return items.filter((item) => {
    if (!matchesSearch([item.kodebeli, item.namasupplier], filter.query)) return false;
    if (filter.tanggalDari && item.tanggal < filter.tanggalDari) return false;
    if (filter.tanggalSampai && item.tanggal > filter.tanggalSampai) return false;

    return true;
  });
}
