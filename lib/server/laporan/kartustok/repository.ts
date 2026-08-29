import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { FilterLaporanKartuStok, GrupLaporanKartuStok } from "@/lib/server/laporan/kartustok/types";

/**
 * Mutasi kronologis lintas semua Lokasi, dikelompokkan per Barang, dengan saldo berjalan
 * dihitung dari nol sepanjang seluruh riwayat Barang itu (tak ada saldo awal periode — tak ada
 * filter tanggal di laporan ini). Pola baca sama seperti `hitungSaldoStok` di
 * `lib/server/kartustok/repository.ts`, tapi lintas Lokasi dan mempertahankan tiap baris mutasi.
 */
export async function findLaporanKartuStok(
  db    : DatabasePerusahaanClient,
  filter: FilterLaporanKartuStok = {},
): Promise<GrupLaporanKartuStok[]> {
  const barangList = await db.barang.findMany({
    where  : filter.idbarang ? { idbarang: filter.idbarang, pakaistok: true, status: 1 } : { pakaistok: true, status: 1 },
    orderBy: { idbarang: "asc" },
    select : { idbarang: true, namabarang: true, satuan: true },
  });

  if (barangList.length === 0) {
    return [];
  }

  const idbarangList = barangList.map((barang) => barang.idbarang);

  const kartustokRows = await db.kartustok.findMany({
    where  : { idbarang: { in: idbarangList } },
    orderBy: [{ tgltrans: "asc" }, { kodetrans: "asc" }, { urutan: "asc" }],
  });

  const idlokasiUnik = [...new Set(kartustokRows.map((row) => row.idlokasi))];
  const lokasiList = idlokasiUnik.length > 0
    ? await db.lokasi.findMany({ where: { idlokasi: { in: idlokasiUnik } }, select: { idlokasi: true, namalokasi: true } })
    : [];
  const namaLokasi = new Map(lokasiList.map((lokasi) => [lokasi.idlokasi, lokasi.namalokasi]));

  const rowsPerBarang = new Map<number, typeof kartustokRows>();
  for (const row of kartustokRows) {
    const arr = rowsPerBarang.get(row.idbarang) ?? [];
    arr.push(row);
    rowsPerBarang.set(row.idbarang, arr);
  }

  return barangList.map((barang) => {
    const rows = rowsPerBarang.get(barang.idbarang) ?? [];

    let saldo = 0;
    const baris = rows.map((row) => {
      const jml = Number(row.jml);
      saldo += row.mk === "M" ? jml : -jml;

      return {
        tgltrans      : row.tgltrans,
        kodetrans     : row.kodetrans,
        jenistransaksi: row.jenistransaksi,
        namalokasi    : namaLokasi.get(row.idlokasi) ?? "-",
        masuk         : row.mk === "M" ? jml : null,
        keluar        : row.mk === "K" ? jml : null,
        saldoBerjalan : saldo,
        catatan       : row.catatan,
      };
    });

    return {
      idbarang  : barang.idbarang,
      namabarang: barang.namabarang,
      satuan    : barang.satuan,
      baris,
    };
  });
}
