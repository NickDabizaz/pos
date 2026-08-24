import type { Kas, KasFilter } from "@/app/transaksi/kas/lib/types";
import { matchesSearch } from "@/lib/textSearch";

export function filterKas(items: Kas[], filter: KasFilter): Kas[] {
  return items.filter((item) => {
    if (!matchesSearch([item.kodekas, ...item.rincian.map((r) => r.keterangan)], filter.query)) return false;
    if (filter.jenis !== "SEMUA" && item.jenis !== filter.jenis) return false;
    if (filter.kodelokasi !== "SEMUA" && item.kodelokasi !== filter.kodelokasi) return false;
    if (filter.tanggalDari && item.tanggal < filter.tanggalDari) return false;
    if (filter.tanggalSampai && item.tanggal > filter.tanggalSampai) return false;

    return true;
  });
}
