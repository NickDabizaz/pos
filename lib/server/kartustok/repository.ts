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
