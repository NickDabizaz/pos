import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { Pembelian } from "@/lib/server/pembelian/types";
import type { PpnMode, StatusTransaksi } from "@/lib/server/transaksi/types";

type Decimalish = { toString(): string };

type BeliRow = {
  kodebeli   : string;
  tgltrans   : Date;
  status     : string;
  alasanbatal: string | null;
  total      : Decimalish;
  diskon     : Decimalish;
  ppn        : Decimalish;
  grandtotal : Decimalish;
  supplier   : { kodesupplier: string; namasupplier: string };
  lokasi     : { kodelokasi: string; namalokasi: string };
  details: Array<{
    qty     : Decimalish;
    harga   : Decimalish;
    pakaippn: string;
    diskon  : Decimalish;
    ppn     : Decimalish;
    subtotal: Decimalish;
    barang  : { kodebarang: string; namabarang: string; satuan: string };
  }>;
};

const includeDetail = {
  supplier: true,
  lokasi  : true,
  details : { include: { barang: true }, orderBy: { urutan: "asc" as const } },
};

function toPembelian(row: BeliRow): Pembelian {
  return {
    kodebeli    : row.kodebeli,
    tanggal     : row.tgltrans.toISOString().slice(0, 10),
    kodesupplier: row.supplier.kodesupplier,
    namasupplier: row.supplier.namasupplier,
    kodelokasi  : row.lokasi.kodelokasi,
    namalokasi  : row.lokasi.namalokasi,
    items: row.details.map((detail) => ({
      kodebarang: detail.barang.kodebarang,
      namabarang: detail.barang.namabarang,
      satuan    : detail.barang.satuan,
      qty       : Number(detail.qty),
      harga     : Number(detail.harga),
      pakaiPpn  : detail.pakaippn as PpnMode,
      diskon    : Number(detail.diskon),
      ppn       : Number(detail.ppn),
      subtotal  : Number(detail.subtotal),
    })),
    total      : Number(row.total),
    diskon     : Number(row.diskon),
    ppn        : Number(row.ppn),
    grandtotal : Number(row.grandtotal),
    status     : row.status as StatusTransaksi,
    alasanbatal: row.alasanbatal,
  };
}

export async function findConfigPpn(db: DatabasePerusahaanClient): Promise<{ config: string; nilai: string }[]> {
  const rows = await db.config.findMany({ where: { modul: "PPN" }, select: { config: true, nilai: true } });

  return rows;
}

export async function findAllPembelian(db: DatabasePerusahaanClient): Promise<Pembelian[]> {
  const rows = await db.beli.findMany({ include: includeDetail, orderBy: { idbeli: "asc" } });

  return rows.map(toPembelian);
}

export async function findPembelianByKode(db: DatabasePerusahaanClient, kodebeli: string): Promise<Pembelian | null> {
  const row = await db.beli.findUnique({ where: { kodebeli }, include: includeDetail });

  return row ? toPembelian(row) : null;
}

export type InsertPembelianItemData = {
  idbarang: number;
  qty     : number;
  harga   : number;
  pakaippn: PpnMode;
  diskon  : number;
  ppn     : number;
  subtotal: number;
};

export type InsertPembelianData = {
  tgltrans  : Date;
  idsupplier: number;
  idlokasi  : number;
  total     : number;
  diskon    : number;
  ppn       : number;
  grandtotal: number;
  items     : InsertPembelianItemData[];
};

export async function insertPembelianLengkap(
  db      : DatabasePerusahaanClient,
  kodebeli: string,
  data    : InsertPembelianData,
): Promise<number> {
  const beli = await db.beli.create({
    data: {
      kodebeli,
      tgltrans  : data.tgltrans,
      idsupplier: data.idsupplier,
      idlokasi  : data.idlokasi,
      total     : data.total,
      diskon    : data.diskon,
      ppn       : data.ppn,
      grandtotal: data.grandtotal,
    },
  });

  await db.belidtl.createMany({
    data: data.items.map((item, index) => ({
      idbeli  : beli.idbeli,
      urutan  : index + 1,
      idbarang: item.idbarang,
      qty     : item.qty,
      harga   : item.harga,
      pakaippn: item.pakaippn,
      diskon  : item.diskon,
      ppn     : item.ppn,
      subtotal: item.subtotal,
    })),
  });

  return beli.idbeli;
}

export type UpdatePembelianData = {
  idsupplier: number;
  total     : number;
  diskon    : number;
  ppn       : number;
  grandtotal: number;
  items     : InsertPembelianItemData[];
};

export type UpdatePembelianInduk = {
  idbeli  : number;
  tgltrans: Date;
  idlokasi: number;
};

export async function updatePembelianLengkap(
  db      : DatabasePerusahaanClient,
  kodebeli: string,
  data    : UpdatePembelianData,
): Promise<UpdatePembelianInduk> {
  const beli = await db.beli.update({
    where: { kodebeli },
    data : {
      idsupplier: data.idsupplier,
      total     : data.total,
      diskon    : data.diskon,
      ppn       : data.ppn,
      grandtotal: data.grandtotal,
    },
  });

  await db.belidtl.deleteMany({ where: { idbeli: beli.idbeli } });

  await db.belidtl.createMany({
    data: data.items.map((item, index) => ({
      idbeli  : beli.idbeli,
      urutan  : index + 1,
      idbarang: item.idbarang,
      qty     : item.qty,
      harga   : item.harga,
      pakaippn: item.pakaippn,
      diskon  : item.diskon,
      ppn     : item.ppn,
      subtotal: item.subtotal,
    })),
  });

  return { idbeli: beli.idbeli, tgltrans: beli.tgltrans, idlokasi: beli.idlokasi };
}

export async function updateStatusPembelianByKode(
  db         : DatabasePerusahaanClient,
  kodebeli   : string,
  alasanbatal: string | null,
): Promise<number> {
  const beli = await db.beli.update({ where: { kodebeli }, data: { status: "D", alasanbatal } });

  return beli.idbeli;
}
