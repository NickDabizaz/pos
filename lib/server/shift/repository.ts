import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";

type Decimalish = { toString(): string };

export type ModalAwalRow = {
  idmodalawal: number;
  tgltrans   : Date;
  idlokasi   : number;
  idkasir    : string;
  nominal    : Decimalish;
};

export type SetoranKasirRow = {
  idsetorankasir: number;
  tgltrans      : Date;
  idlokasi      : number;
  totaltunai    : Decimalish;
  totalnontunai : Decimalish;
  kasaktual     : Decimalish;
  selisih       : Decimalish;
  catatan       : string | null;
};

export async function findModalAwal(
  db      : DatabasePerusahaanClient,
  tgltrans: Date,
  idlokasi: number,
): Promise<ModalAwalRow | null> {
  const row = await db.modalawal.findUnique({ where: { tgltrans_idlokasi: { tgltrans, idlokasi } } });

  return row;
}

export async function insertModalAwal(
  db      : DatabasePerusahaanClient,
  tgltrans: Date,
  idlokasi: number,
  idkasir : string,
  nominal : number,
): Promise<ModalAwalRow> {
  const row = await db.modalawal.create({ data: { tgltrans, idlokasi, idkasir, nominal } });

  return row;
}

export async function findSetoranKasir(
  db      : DatabasePerusahaanClient,
  tgltrans: Date,
  idlokasi: number,
): Promise<SetoranKasirRow | null> {
  const row = await db.setorankasir.findUnique({ where: { tgltrans_idlokasi: { tgltrans, idlokasi } } });

  return row;
}

export type InsertSetoranKasirData = {
  totaltunai   : number;
  totalnontunai: number;
  kasaktual    : number;
  selisih      : number;
  catatan      : string | null;
};

export async function insertSetoranKasir(
  db      : DatabasePerusahaanClient,
  tgltrans: Date,
  idlokasi: number,
  data    : InsertSetoranKasirData,
): Promise<SetoranKasirRow> {
  const row = await db.setorankasir.create({
    data: {
      tgltrans,
      idlokasi,
      totaltunai   : data.totaltunai,
      totalnontunai: data.totalnontunai,
      kasaktual    : data.kasaktual,
      selisih      : data.selisih,
      catatan      : data.catatan,
    },
  });

  return row;
}

export async function deleteSetoranKasir(
  db      : DatabasePerusahaanClient,
  tgltrans: Date,
  idlokasi: number,
): Promise<void> {
  await db.setorankasir.delete({ where: { tgltrans_idlokasi: { tgltrans, idlokasi } } });
}

export type AgregasiPembayaranHarian = {
  totaltunai     : number;
  totalnontunai  : number;
  jumlahtransaksi: number;
};

export async function sumPembayaranHarian(
  db      : DatabasePerusahaanClient,
  tgltrans: Date,
  idlokasi: number,
): Promise<AgregasiPembayaranHarian> {
  const rows = await db.jual.findMany({
    where  : { tgltrans, idlokasi, status: { not: "D" } },
    include: { bayar: true },
  });

  let totaltunai = 0;
  let totalnontunai = 0;

  for (const row of rows) {
    for (const bayar of row.bayar) {
      totaltunai += Number(bayar.tunai);
      totalnontunai += Number(bayar.nontunai);
    }
  }

  return { totaltunai, totalnontunai, jumlahtransaksi: rows.length };
}
