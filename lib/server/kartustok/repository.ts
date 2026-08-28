import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { JenisTransaksi, MasukKeluar } from "@/lib/server/kartustok/types";

export type KepalaTransaksi = {
  jenistransaksi: JenisTransaksi;
  idtrans       : number;
  kodetrans     : string;
  tgltrans      : Date;
  idlokasi      : number;
};

export type InsertKartuStokBaris = {
  idbarang: number;
  jml     : number;
  mk      : MasukKeluar;
  catatan : string;
};

export async function insertKartuStok(
  db    : DatabasePerusahaanClient,
  kepala: KepalaTransaksi,
  baris : InsertKartuStokBaris[],
): Promise<void> {
  if (baris.length === 0) {
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.kartustok.createMany({
      data: baris.map((item, index) => ({
        jenistransaksi: kepala.jenistransaksi,
        idtrans       : kepala.idtrans,
        urutan        : index + 1,
        kodetrans     : kepala.kodetrans,
        tgltrans      : kepala.tgltrans,
        idlokasi      : kepala.idlokasi,
        idbarang      : item.idbarang,
        jml           : item.jml,
        mk            : item.mk,
        catatan       : item.catatan,
      })),
    });
  });
}

export async function deleteKartuStok(
  db            : DatabasePerusahaanClient,
  jenistransaksi: JenisTransaksi,
  idtrans       : number,
): Promise<void> {
  await db.kartustok.deleteMany({ where: { jenistransaksi, idtrans } });
}

export type SaldoStokBarang = {
  idbarang  : number;
  kodebarang: string;
  namabarang: string;
  satuan    : string;
  jmlsistem : number;
};

/**
 * Saldo stok menurut Kartu Stok untuk setiap Barang berstok aktif di satu Lokasi, sampai
 * dengan `tanggal` (inklusif). jmlsistem = jumlah pergerakan masuk dikurangi keluar. Barang
 * berstok aktif yang belum pernah bergerak ikut dikembalikan dengan jmlsistem 0. Barang dengan
 * `pakaistok` mati atau berstatus nonaktif tidak pernah muncul. Pembaca `kartustok` pertama di
 * codebase; sengaja tidak lewat tabel induk transaksi (lihat komentar model kartustok).
 */
export async function hitungSaldoStok(
  db      : DatabasePerusahaanClient,
  idlokasi: number,
  tanggal : Date,
): Promise<SaldoStokBarang[]> {
  const barang = await db.barang.findMany({
    where  : { pakaistok: true, status: 1 },
    orderBy: { idbarang: "asc" },
    select : { idbarang: true, kodebarang: true, namabarang: true, satuan: true },
  });

  const gerak = await db.kartustok.groupBy({
    by   : ["idbarang", "mk"],
    where: { idlokasi, tgltrans: { lte: tanggal } },
    _sum : { jml: true },
  });

  const saldoPerBarang = new Map<number, number>();
  for (const row of gerak) {
    const jml = Number(row._sum.jml ?? 0);
    const berarah = row.mk === "M" ? jml : -jml;
    saldoPerBarang.set(row.idbarang, (saldoPerBarang.get(row.idbarang) ?? 0) + berarah);
  }

  return barang.map((item) => ({
    idbarang  : item.idbarang,
    kodebarang: item.kodebarang,
    namabarang: item.namabarang,
    satuan    : item.satuan,
    jmlsistem : saldoPerBarang.get(item.idbarang) ?? 0,
  }));
}
