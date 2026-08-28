import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { OpnameStok } from "@/lib/server/opnamestok/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

type Decimalish = { toString(): string };

type OpnameStokRow = {
  kodeopname : string;
  tgltrans   : Date;
  status     : string;
  alasanbatal: string | null;
  lokasi     : { kodelokasi: string; namalokasi: string };
  details: Array<{
    satuan   : string;
    jmlsistem: Decimalish;
    jmlfisik : Decimalish;
    selisih  : Decimalish;
    barang   : { kodebarang: string; namabarang: string };
  }>;
};

const includeDetail = {
  lokasi : true,
  details: { include: { barang: true }, orderBy: { urutan: "asc" as const } },
};

function toOpnameStok(row: OpnameStokRow): OpnameStok {
  return {
    kodeopname : row.kodeopname,
    tanggal    : row.tgltrans.toISOString().slice(0, 10),
    kodelokasi : row.lokasi.kodelokasi,
    namalokasi : row.lokasi.namalokasi,
    items: row.details.map((detail) => ({
      kodebarang: detail.barang.kodebarang,
      namabarang: detail.barang.namabarang,
      satuan    : detail.satuan,
      jmlsistem : Number(detail.jmlsistem),
      jmlfisik  : Number(detail.jmlfisik),
      selisih   : Number(detail.selisih),
    })),
    status     : row.status as StatusTransaksi,
    alasanbatal: row.alasanbatal,
  };
}

export async function findAllOpnameStok(db: DatabasePerusahaanClient): Promise<OpnameStok[]> {
  const rows = await db.opnamestok.findMany({ include: includeDetail, orderBy: { idopnamestok: "asc" } });

  return rows.map(toOpnameStok);
}

export async function findOpnameStokByKode(db: DatabasePerusahaanClient, kodeopname: string): Promise<OpnameStok | null> {
  const row = await db.opnamestok.findUnique({ where: { kodeopname }, include: includeDetail });

  return row ? toOpnameStok(row) : null;
}

export type OpnameStokInduk = {
  idopnamestok: number;
  tgltrans    : Date;
  idlokasi    : number;
  status      : StatusTransaksi;
};

export async function findOpnameStokInduk(db: DatabasePerusahaanClient, kodeopname: string): Promise<OpnameStokInduk | null> {
  const row = await db.opnamestok.findUnique({
    where : { kodeopname },
    select: { idopnamestok: true, tgltrans: true, idlokasi: true, status: true },
  });

  return row ? { ...row, status: row.status as StatusTransaksi } : null;
}

export type InsertOpnameStokItemData = {
  idbarang : number;
  satuan   : string;
  jmlsistem: number;
  jmlfisik : number;
  selisih  : number;
};

export type InsertOpnameStokData = {
  tgltrans: Date;
  idlokasi: number;
  items   : InsertOpnameStokItemData[];
};

export async function insertOpnameStokLengkap(
  db        : DatabasePerusahaanClient,
  kodeopname: string,
  data      : InsertOpnameStokData,
): Promise<number> {
  const opname = await db.opnamestok.create({
    data: {
      kodeopname,
      tgltrans: data.tgltrans,
      idlokasi: data.idlokasi,
    },
  });

  await db.opnamestokdtl.createMany({
    data: data.items.map((item, index) => ({
      idopnamestok: opname.idopnamestok,
      urutan      : index + 1,
      idbarang    : item.idbarang,
      satuan      : item.satuan,
      jmlsistem   : item.jmlsistem,
      jmlfisik    : item.jmlfisik,
      selisih     : item.selisih,
    })),
  });

  return opname.idopnamestok;
}

export async function updateOpnameStokLengkap(
  db          : DatabasePerusahaanClient,
  idopnamestok: number,
  items       : InsertOpnameStokItemData[],
): Promise<void> {
  await db.opnamestokdtl.deleteMany({ where: { idopnamestok } });

  await db.opnamestokdtl.createMany({
    data: items.map((item, index) => ({
      idopnamestok,
      urutan   : index + 1,
      idbarang : item.idbarang,
      satuan   : item.satuan,
      jmlsistem: item.jmlsistem,
      jmlfisik : item.jmlfisik,
      selisih  : item.selisih,
    })),
  });
}

export async function updateStatusOpnameStokByKode(
  db         : DatabasePerusahaanClient,
  kodeopname : string,
  alasanbatal: string | null,
): Promise<number> {
  const opname = await db.opnamestok.update({ where: { kodeopname }, data: { status: "D", alasanbatal } });

  return opname.idopnamestok;
}
