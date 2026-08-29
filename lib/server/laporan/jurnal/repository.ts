import type { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { SaldoJurnal } from "@/lib/server/jurnal/types";
import type { BarisLaporanJurnal, FilterLaporanJurnal } from "@/lib/server/laporan/jurnal/types";

/**
 * Baris `jurnal` apa adanya, diurut `tgltrans`, `kodetrans`, `urutan`. Tak ada flag
 * `termasukDibatalkan` — pembatalan transaksi menghapus keras baris `jurnal`-nya di setiap jalur
 * (Penjualan/Pembelian/Kas), jadi baris yang tersisa selalu milik transaksi hidup. Lihat Comments
 * di tiket 04.
 */
export async function findBarisLaporanJurnal(
  db    : DatabasePerusahaanClient,
  filter: FilterLaporanJurnal = {},
): Promise<BarisLaporanJurnal[]> {
  const where: Prisma.jurnalWhereInput = {};

  if (filter.kodetrans) {
    where.kodetrans = { contains: filter.kodetrans };
  }

  if (filter.dari || filter.sampai) {
    where.tgltrans = {
      ...(filter.dari ? { gte: filter.dari } : {}),
      ...(filter.sampai ? { lte: filter.sampai } : {}),
    };
  }

  const rows = await db.jurnal.findMany({
    where,
    orderBy: [{ tgltrans: "asc" }, { kodetrans: "asc" }, { urutan: "asc" }],
  });

  const idlokasiUnik = [...new Set(rows.map((row) => row.idlokasi))];
  const lokasiList = idlokasiUnik.length > 0
    ? await db.lokasi.findMany({ where: { idlokasi: { in: idlokasiUnik } }, select: { idlokasi: true, namalokasi: true } })
    : [];
  const namaLokasi = new Map(lokasiList.map((lokasi) => [lokasi.idlokasi, lokasi.namalokasi]));

  return rows.map((row) => ({
    kodetrans     : row.kodetrans,
    tgltrans      : row.tgltrans,
    jenistransaksi: row.jenistransaksi,
    namalokasi    : namaLokasi.get(row.idlokasi) ?? "-",
    urutan        : row.urutan,
    saldo         : row.saldo as SaldoJurnal,
    amount        : Number(row.amount),
    catatan       : row.catatan,
  }));
}
