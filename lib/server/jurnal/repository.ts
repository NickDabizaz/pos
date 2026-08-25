import type { KepalaTransaksi } from "@/lib/server/kartustok/repository";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { SaldoJurnal } from "@/lib/server/jurnal/types";
import type { JenisTransaksi } from "@/lib/server/kartustok/types";

export type InsertJurnalBaris = {
  saldo  : SaldoJurnal;
  amount : number;
  catatan: string;
};

export async function insertJurnal(
  db    : DatabasePerusahaanClient,
  kepala: KepalaTransaksi,
  baris : InsertJurnalBaris[],
): Promise<void> {
  if (baris.length === 0) {
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.jurnal.createMany({
      data: baris.map((item, index) => ({
        jenistransaksi: kepala.jenistransaksi,
        idtrans       : kepala.idtrans,
        urutan        : index + 1,
        kodetrans     : kepala.kodetrans,
        tgltrans      : kepala.tgltrans,
        idlokasi      : kepala.idlokasi,
        saldo         : item.saldo,
        amount        : item.amount,
        catatan       : item.catatan,
      })),
    });
  });
}

export async function deleteJurnal(
  db            : DatabasePerusahaanClient,
  jenistransaksi: JenisTransaksi,
  idtrans       : number,
): Promise<void> {
  await db.jurnal.deleteMany({ where: { jenistransaksi, idtrans } });
}
