import type { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { JenisKas } from "@/lib/server/kas/types";
import type { TransaksiLaporanKas, FilterLaporanKas } from "@/lib/server/laporan/kas/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

/** Transaksi `kas` + detail, dikelompokkan per transaksi, diurut `tgltrans`, `kodekas`. */
export async function findBarisLaporanKas(
  db    : DatabasePerusahaanClient,
  filter: FilterLaporanKas = {},
): Promise<TransaksiLaporanKas[]> {
  const where: Prisma.kasWhereInput = {
    status: filter.termasukDibatalkan ? undefined : "S",
  };

  if (filter.dari || filter.sampai) {
    where.tgltrans = {
      ...(filter.dari ? { gte: filter.dari } : {}),
      ...(filter.sampai ? { lte: filter.sampai } : {}),
    };
  }

  if (filter.idlokasi) {
    where.idlokasi = { in: filter.idlokasi };
  }

  const rows = await db.kas.findMany({
    where,
    include: {
      lokasi : true,
      details: { orderBy: { urutan: "asc" } },
    },
    orderBy: [{ tgltrans: "asc" }, { kodekas: "asc" }],
  });

  return rows.map((kas) => ({
    kodekas   : kas.kodekas,
    tgltrans  : kas.tgltrans,
    namalokasi: kas.lokasi.namalokasi,
    jenis     : kas.jenis as JenisKas,
    grandtotal: Number(kas.grandtotal),
    status    : kas.status as StatusTransaksi,
    detail    : kas.details.map((detail) => ({
      keterangan: detail.keterangan,
      nominal   : Number(detail.nominal),
    })),
  }));
}
