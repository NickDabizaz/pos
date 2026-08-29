import type { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { BarisLaporanPembelian, FilterLaporanPembelian } from "@/lib/server/laporan/pembelian/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

/** Baris `belidtl` flatten dengan nilai transaksi induk, diurut `tgltrans`, `kodebeli`, `urutan`. */
export async function findBarisLaporanPembelian(
  db    : DatabasePerusahaanClient,
  filter: FilterLaporanPembelian = {},
): Promise<BarisLaporanPembelian[]> {
  const where: Prisma.beliWhereInput = {
    status: filter.termasukDibatalkan ? undefined : "S",
  };

  if (filter.dari || filter.sampai) {
    where.tgltrans = {
      ...(filter.dari ? { gte: filter.dari } : {}),
      ...(filter.sampai ? { lte: filter.sampai } : {}),
    };
  }

  const rows = await db.beli.findMany({
    where,
    include: {
      supplier: true,
      lokasi  : true,
      details : { include: { barang: true }, orderBy: { urutan: "asc" } },
    },
    orderBy: [{ tgltrans: "asc" }, { kodebeli: "asc" }],
  });

  const baris: BarisLaporanPembelian[] = [];
  for (const beli of rows) {
    for (const detail of beli.details) {
      baris.push({
        kodebeli    : beli.kodebeli,
        tgltrans    : beli.tgltrans,
        namalokasi  : beli.lokasi.namalokasi,
        namasupplier: beli.supplier.namasupplier,
        total       : Number(beli.total),
        diskon      : Number(beli.diskon),
        ppn         : Number(beli.ppn),
        grandtotal  : Number(beli.grandtotal),
        status      : beli.status as StatusTransaksi,
        namabarang  : detail.barang.namabarang,
        satuan      : detail.barang.satuan,
        qty         : Number(detail.qty),
        harga       : Number(detail.harga),
        subtotal    : Number(detail.subtotal),
        ppnBaris    : Number(detail.ppn),
      });
    }
  }

  return baris;
}
