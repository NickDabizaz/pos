import type { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { BarisLaporanPenjualan, FilterLaporanPenjualan } from "@/lib/server/laporan/penjualan/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

/** Baris `jualdtl` flatten dengan nilai transaksi induk, diurut `tgltrans`, `kodejual`, `urutan`. */
export async function findBarisLaporanPenjualan(
  db    : DatabasePerusahaanClient,
  filter: FilterLaporanPenjualan = {},
): Promise<BarisLaporanPenjualan[]> {
  const where: Prisma.jualWhereInput = {
    status: filter.termasukDibatalkan ? undefined : "S",
  };

  if (filter.dari || filter.sampai) {
    where.tgltrans = {
      ...(filter.dari ? { gte: filter.dari } : {}),
      ...(filter.sampai ? { lte: filter.sampai } : {}),
    };
  }

  const rows = await db.jual.findMany({
    where,
    include: {
      customer: true,
      lokasi  : true,
      details : { include: { barang: true }, orderBy: { urutan: "asc" } },
    },
    orderBy: [{ tgltrans: "asc" }, { kodejual: "asc" }],
  });

  const baris: BarisLaporanPenjualan[] = [];
  for (const jual of rows) {
    for (const detail of jual.details) {
      baris.push({
        kodejual    : jual.kodejual,
        tgltrans    : jual.tgltrans,
        namalokasi  : jual.lokasi.namalokasi,
        namacustomer: jual.customer.namacustomer,
        total       : Number(jual.total),
        diskon      : Number(jual.diskon),
        ppn         : Number(jual.ppn),
        grandtotal  : Number(jual.grandtotal),
        status      : jual.status as StatusTransaksi,
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
