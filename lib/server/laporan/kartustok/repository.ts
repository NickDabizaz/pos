import type { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { FilterLaporanKartuStok, GrupLaporanKartuStok } from "@/lib/server/laporan/kartustok/types";

/**
 * Mutasi kronologis per Barang untuk Lokasi terpilih. **Saldo Awal** = akumulasi seluruh mutasi
 * sebelum `dari` (tanpa `dari` = 0); baris yang dijabarkan hanya mutasi di dalam periode
 * `dari`..`sampai` (inklusif). Barang tanpa mutasi periode **dan** Saldo Awal 0 tidak muncul.
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
  const where: Prisma.kartustokWhereInput = { idbarang: { in: idbarangList } };
  if (filter.idlokasi) {
    where.idlokasi = { in: filter.idlokasi };
  }

  const kartustokRows = await db.kartustok.findMany({
    where,
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

  const hasil: GrupLaporanKartuStok[] = [];

  for (const barang of barangList) {
    const rows = rowsPerBarang.get(barang.idbarang) ?? [];

    let saldoAwal = 0;
    const baris: GrupLaporanKartuStok["baris"] = [];

    for (const row of rows) {
      const jml = Number(row.jml);
      const berarah = row.mk === "M" ? jml : -jml;

      if (filter.dari && row.tgltrans < filter.dari) {
        saldoAwal += berarah;
        continue;
      }
      if (filter.sampai && row.tgltrans > filter.sampai) {
        continue;
      }

      baris.push({
        tgltrans      : row.tgltrans,
        kodetrans     : row.kodetrans,
        jenistransaksi: row.jenistransaksi,
        namalokasi    : namaLokasi.get(row.idlokasi) ?? "-",
        masuk         : row.mk === "M" ? jml : null,
        keluar        : row.mk === "K" ? jml : null,
        saldoBerjalan : 0,
        catatan       : row.catatan,
      });
    }

    if (saldoAwal === 0 && baris.length === 0) {
      continue;
    }

    let saldo = saldoAwal;
    for (const item of baris) {
      saldo += (item.masuk ?? 0) - (item.keluar ?? 0);
      item.saldoBerjalan = saldo;
    }

    hasil.push({
      idbarang  : barang.idbarang,
      namabarang: barang.namabarang,
      satuan    : barang.satuan,
      saldoAwal,
      saldoAkhir: saldo,
      baris,
    });
  }

  return hasil;
}
