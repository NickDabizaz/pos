import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { Kas, JenisKas } from "@/lib/server/kas/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

type Decimalish = { toString(): string };

type KasRow = {
  kodekas    : string;
  tgltrans   : Date;
  jenis      : string;
  status     : string;
  alasanbatal: string | null;
  grandtotal : Decimalish;
  lokasi     : { kodelokasi: string; namalokasi: string };
  details: Array<{
    keterangan: string;
    nominal   : Decimalish;
  }>;
};

const includeDetail = {
  lokasi : true,
  details: { orderBy: { urutan: "asc" as const } },
};

function toKas(row: KasRow): Kas {
  return {
    kodekas    : row.kodekas,
    tanggal    : row.tgltrans.toISOString().slice(0, 10),
    jenis      : row.jenis as JenisKas,
    kodelokasi : row.lokasi.kodelokasi,
    namalokasi : row.lokasi.namalokasi,
    rincian: row.details.map((detail) => ({
      keterangan: detail.keterangan,
      nominal   : Number(detail.nominal),
    })),
    grandtotal : Number(row.grandtotal),
    status     : row.status as StatusTransaksi,
    alasanbatal: row.alasanbatal,
  };
}

export async function findAllKas(db: DatabasePerusahaanClient): Promise<Kas[]> {
  const rows = await db.kas.findMany({ include: includeDetail, orderBy: { idkas: "asc" } });

  return rows.map(toKas);
}

export async function findKasByKode(db: DatabasePerusahaanClient, kodekas: string): Promise<Kas | null> {
  const row = await db.kas.findUnique({ where: { kodekas }, include: includeDetail });

  return row ? toKas(row) : null;
}

export type InsertKasRincianData = {
  keterangan: string;
  nominal   : number;
};

export type InsertKasData = {
  tgltrans  : Date;
  jenis     : JenisKas;
  idlokasi  : number;
  grandtotal: number;
  rincian   : InsertKasRincianData[];
};

export async function insertKasLengkap(
  db      : DatabasePerusahaanClient,
  kodekas : string,
  data    : InsertKasData,
): Promise<number> {
  const kas = await db.kas.create({
    data: {
      kodekas,
      tgltrans  : data.tgltrans,
      jenis     : data.jenis,
      idlokasi  : data.idlokasi,
      grandtotal: data.grandtotal,
    },
  });

  await db.kasdtl.createMany({
    data: data.rincian.map((item, index) => ({
      idkas     : kas.idkas,
      urutan    : index + 1,
      keterangan: item.keterangan,
      nominal   : item.nominal,
    })),
  });

  return kas.idkas;
}

export async function updateStatusKasByKode(
  db         : DatabasePerusahaanClient,
  kodekas    : string,
  alasanbatal: string | null,
): Promise<number> {
  const kas = await db.kas.update({ where: { kodekas }, data: { status: "D", alasanbatal } });

  return kas.idkas;
}

export type UpdateKasData = {
  jenis     : JenisKas;
  grandtotal: number;
  rincian   : InsertKasRincianData[];
};

export type UpdateKasInduk = {
  idkas   : number;
  tgltrans: Date;
  idlokasi: number;
};

export async function updateKasLengkap(
  db      : DatabasePerusahaanClient,
  kodekas : string,
  data    : UpdateKasData,
): Promise<UpdateKasInduk> {
  const kas = await db.kas.update({
    where: { kodekas },
    data : {
      jenis     : data.jenis,
      grandtotal: data.grandtotal,
    },
  });

  await db.kasdtl.deleteMany({ where: { idkas: kas.idkas } });

  await db.kasdtl.createMany({
    data: data.rincian.map((item, index) => ({
      idkas     : kas.idkas,
      urutan    : index + 1,
      keterangan: item.keterangan,
      nominal   : item.nominal,
    })),
  });

  return { idkas: kas.idkas, tgltrans: kas.tgltrans, idlokasi: kas.idlokasi };
}
