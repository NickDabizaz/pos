import type { PenjualanFilter } from "@/app/transaksi/penjualan/lib/types";
import type { Penjualan } from "@/lib/server/penjualan/types";
import { matchesSearch } from "@/lib/textSearch";

export function filterPenjualan(items: Penjualan[], filter: PenjualanFilter): Penjualan[] {
  return items.filter((item) => {
    if (!matchesSearch([item.kodejual, item.namacustomer], filter.query)) return false;
    if (filter.jenistransaksi !== "SEMUA" && item.jenistransaksi !== filter.jenistransaksi) return false;
    if (filter.tanggalDari && item.tanggal < filter.tanggalDari) return false;
    if (filter.tanggalSampai && item.tanggal > filter.tanggalSampai) return false;

    return true;
  });
}
