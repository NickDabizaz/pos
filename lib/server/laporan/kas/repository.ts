import type { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { JenisKas } from "@/lib/server/kas/types";
import type { BarisLaporanKas, FilterLaporanKas } from "@/lib/server/laporan/kas/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

/** Baris `kasdtl` flatten dengan nilai transaksi induk, diurut `tgltrans`, `kodekas`, `urutan`. */
export async function findBarisLaporanKas(
  db    : DatabasePerusahaanClient,
  filter: FilterLaporanKas = {},
): Promise<BarisLaporanKas[]> {
  const where: Prisma.kasWhereInput = {
    status: filter.termasukDibatalkan ? undefined : "S",
  };

  if (filter.dari || filter.sampai) {
    where.tgltrans = {
      ...(filter.dari ? { gte: filter.dari } : {}),
      ...(filter.sampai ? { lte: filter.sampai } : {}),
    };
  }

  const rows = await db.kas.findMany({
    where,
    include: {
      lokasi : true,
      details: { orderBy: { urutan: "asc" } },
    },
    orderBy: [{ tgltrans: "asc" }, { kodekas: "asc" }],
  });

  const baris: BarisLaporanKas[] = [];
  for (const kas of rows) {
    for (const detail of kas.details) {
      baris.push({
        kodekas   : kas.kodekas,
        tgltrans  : kas.tgltrans,
        namalokasi: kas.lokasi.namalokasi,
        jenis     : kas.jenis as JenisKas,
        grandtotal: Number(kas.grandtotal),
        status    : kas.status as StatusTransaksi,
        keterangan: detail.keterangan,
        nominal   : Number(detail.nominal),
      });
    }
  }

  return baris;
}
