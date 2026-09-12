import type { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { TransaksiLaporanOpnameStok, FilterLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

/**
 * Transaksi `opnamestok` + detail, dikelompokkan per transaksi. Default hanya detail berselisih
 * (`tampilkanSemua` untuk seluruh barang); jumlah baris sesuai yang disembunyikan tetap dilaporkan.
 */
export async function findBarisLaporanOpnameStok(
  db    : DatabasePerusahaanClient,
  filter: FilterLaporanOpnameStok = {},
): Promise<TransaksiLaporanOpnameStok[]> {
  const where: Prisma.opnamestokWhereInput = {
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

  const rows = await db.opnamestok.findMany({
    where,
    include: {
      lokasi : true,
      details: { include: { barang: true }, orderBy: { urutan: "asc" } },
    },
    orderBy: [{ tgltrans: "asc" }, { kodeopname: "asc" }],
  });

  return rows.map((opname) => {
    const semua = opname.details.map((detail) => ({
      namabarang: detail.barang.namabarang,
      satuan    : detail.satuan,
      jmlsistem : Number(detail.jmlsistem),
      jmlfisik  : Number(detail.jmlfisik),
      selisih   : Number(detail.selisih),
    }));

    const detail = filter.tampilkanSemua ? semua : semua.filter((row) => row.selisih !== 0);

    return {
      kodeopname     : opname.kodeopname,
      tgltrans       : opname.tgltrans,
      namalokasi     : opname.lokasi.namalokasi,
      status         : opname.status as StatusTransaksi,
      detail,
      jmlDisembunyikan: semua.length - detail.length,
    };
  });
}
