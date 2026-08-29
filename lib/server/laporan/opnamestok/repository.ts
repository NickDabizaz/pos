import type { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { BarisLaporanOpnameStok, FilterLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

/** Baris `opnamestokdtl` flatten dengan nilai transaksi induk, diurut `tgltrans`, `kodeopname`, `urutan`. */
export async function findBarisLaporanOpnameStok(
  db    : DatabasePerusahaanClient,
  filter: FilterLaporanOpnameStok = {},
): Promise<BarisLaporanOpnameStok[]> {
  const where: Prisma.opnamestokWhereInput = {
    status: filter.termasukDibatalkan ? undefined : "S",
  };

  if (filter.dari || filter.sampai) {
    where.tgltrans = {
      ...(filter.dari ? { gte: filter.dari } : {}),
      ...(filter.sampai ? { lte: filter.sampai } : {}),
    };
  }

  const rows = await db.opnamestok.findMany({
    where,
    include: {
      lokasi : true,
      details: { include: { barang: true }, orderBy: { urutan: "asc" } },
    },
    orderBy: [{ tgltrans: "asc" }, { kodeopname: "asc" }],
  });

  const baris: BarisLaporanOpnameStok[] = [];
  for (const opname of rows) {
    for (const detail of opname.details) {
      baris.push({
        kodeopname: opname.kodeopname,
        tgltrans  : opname.tgltrans,
        namalokasi: opname.lokasi.namalokasi,
        status    : opname.status as StatusTransaksi,
        namabarang: detail.barang.namabarang,
        satuan    : detail.satuan,
        jmlsistem : Number(detail.jmlsistem),
        jmlfisik  : Number(detail.jmlfisik),
        selisih   : Number(detail.selisih),
      });
    }
  }

  return baris;
}
