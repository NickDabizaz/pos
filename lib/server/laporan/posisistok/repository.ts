import { hitungSaldoStok } from "@/lib/server/kartustok/repository";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { BarisLaporanPosisiStok, FilterLaporanPosisiStok } from "@/lib/server/laporan/posisistok/types";

/**
 * Satu baris per (Barang x Lokasi) dengan saldo saat ini (`tanggal` = hari request), memakai
 * ulang `hitungSaldoStok` per Lokasi aktif. Baris bersaldo 0 disaring di sini kecuali
 * `tampilkanNol`; Barang `pakaistok` mati/nonaktif otomatis tidak pernah muncul karena
 * `hitungSaldoStok` sudah menyaringnya.
 */
export async function findLaporanPosisiStok(
  db     : DatabasePerusahaanClient,
  tanggal: Date,
  filter : FilterLaporanPosisiStok = {},
): Promise<BarisLaporanPosisiStok[]> {
  const lokasiList = await db.lokasi.findMany({
    where  : { status: 1 },
    orderBy: { idlokasi: "asc" },
    select : { idlokasi: true, namalokasi: true },
  });

  const baris: BarisLaporanPosisiStok[] = [];
  for (const lokasi of lokasiList) {
    const saldoBarang = await hitungSaldoStok(db, lokasi.idlokasi, tanggal);

    for (const item of saldoBarang) {
      if (filter.idbarang && item.idbarang !== filter.idbarang) {
        continue;
      }
      if (item.jmlsistem === 0 && !filter.tampilkanNol) {
        continue;
      }

      baris.push({
        idbarang  : item.idbarang,
        namabarang: item.namabarang,
        satuan    : item.satuan,
        namalokasi: lokasi.namalokasi,
        saldo     : item.jmlsistem,
      });
    }
  }

  baris.sort((a, b) => a.namabarang.localeCompare(b.namabarang) || a.namalokasi.localeCompare(b.namalokasi));

  return baris;
}
