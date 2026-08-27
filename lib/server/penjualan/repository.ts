import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { JenisTransaksiPenjualan, Penjualan, PpnMode, StatusTransaksi } from "@/lib/server/penjualan/types";

type Decimalish = { toString(): string };

type JualRow = {
  kodejual      : string;
  tgltrans      : Date;
  jenistransaksi: string;
  status        : string;
  alasanbatal   : string | null;
  total         : Decimalish;
  diskon        : Decimalish;
  ppn           : Decimalish;
  grandtotal    : Decimalish;
  customer      : { kodecustomer: string; namacustomer: string };
  lokasi        : { kodelokasi: string; namalokasi: string };
  details: Array<{
    qty     : Decimalish;
    harga   : Decimalish;
    pakaippn: string;
    diskon  : Decimalish;
    ppn     : Decimalish;
    subtotal: Decimalish;
    barang  : { kodebarang: string; namabarang: string; satuan: string };
  }>;
  bayar: Array<{ tunai: Decimalish; nontunai: Decimalish; kembalian: Decimalish }>;
};

const includeDetail = {
  customer: true,
  lokasi  : true,
  details : { include: { barang: true }, orderBy: { urutan: "asc" as const } },
  bayar   : true,
};

function toPenjualan(row: JualRow): Penjualan {
  const bayar = row.bayar[0];

  return {
    kodejual      : row.kodejual,
    tanggal       : row.tgltrans.toISOString().slice(0, 10),
    jenistransaksi: row.jenistransaksi as JenisTransaksiPenjualan,
    kodecustomer  : row.customer.kodecustomer,
    namacustomer  : row.customer.namacustomer,
    kodelokasi    : row.lokasi.kodelokasi,
    namalokasi    : row.lokasi.namalokasi,
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
    total     : Number(row.total),
    diskon    : Number(row.diskon),
    ppn       : Number(row.ppn),
    grandtotal: Number(row.grandtotal),
    status    : row.status as StatusTransaksi,
    alasanbatal: row.alasanbatal,
    pembayaran: {
      tunai    : bayar ? Number(bayar.tunai) : 0,
      nontunai : bayar ? Number(bayar.nontunai) : 0,
      kembalian: bayar ? Number(bayar.kembalian) : 0,
    },
  };
}

export async function findConfigPpn(db: DatabasePerusahaanClient): Promise<{ config: string; nilai: string }[]> {
  const rows = await db.config.findMany({ where: { modul: "PPN" }, select: { config: true, nilai: true } });

  return rows;
}

export async function findAllPenjualan(db: DatabasePerusahaanClient): Promise<Penjualan[]> {
  const rows = await db.jual.findMany({ include: includeDetail, orderBy: { idjual: "asc" } });

  return rows.map(toPenjualan);
}

export async function findPenjualanByKode(db: DatabasePerusahaanClient, kodejual: string): Promise<Penjualan | null> {
  const row = await db.jual.findUnique({ where: { kodejual }, include: includeDetail });

  return row ? toPenjualan(row) : null;
}

export type InsertPenjualanItemData = {
  idbarang: number;
  qty     : number;
  harga   : number;
  pakaippn: PpnMode;
  diskon  : number;
  ppn     : number;
  subtotal: number;
};

export type InsertPenjualanData = {
  tgltrans      : Date;
  jenistransaksi: JenisTransaksiPenjualan;
  idcustomer    : number;
  idlokasi      : number;
  total         : number;
  diskon        : number;
  ppn           : number;
  grandtotal    : number;
  items         : InsertPenjualanItemData[];
  pembayaran    : { tunai: number; nontunai: number; kembalian: number };
};

export async function insertPenjualanLengkap(
  db      : DatabasePerusahaanClient,
  kodejual: string,
  data    : InsertPenjualanData,
): Promise<number> {
  const jual = await db.jual.create({
    data: {
      kodejual,
      tgltrans      : data.tgltrans,
      jenistransaksi: data.jenistransaksi,
      idcustomer    : data.idcustomer,
      idlokasi      : data.idlokasi,
      total         : data.total,
      diskon        : data.diskon,
      ppn           : data.ppn,
      grandtotal    : data.grandtotal,
    },
  });

  await db.jualdtl.createMany({
    data: data.items.map((item, index) => ({
      idjual  : jual.idjual,
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

  await db.bayar.create({
    data: {
      idjual   : jual.idjual,
      tunai    : data.pembayaran.tunai,
      nontunai : data.pembayaran.nontunai,
      kembalian: data.pembayaran.kembalian,
    },
  });

  return jual.idjual;
}

export type UpdatePenjualanData = {
  idcustomer: number;
  total     : number;
  diskon    : number;
  ppn       : number;
  grandtotal: number;
  items     : InsertPenjualanItemData[];
  pembayaran: { tunai: number; nontunai: number; kembalian: number };
};

export type UpdatePenjualanInduk = {
  idjual  : number;
  tgltrans: Date;
  idlokasi: number;
};

export async function updatePenjualanLengkap(
  db      : DatabasePerusahaanClient,
  kodejual: string,
  data    : UpdatePenjualanData,
): Promise<UpdatePenjualanInduk> {
  const jual = await db.jual.update({
    where: { kodejual },
    data : {
      idcustomer: data.idcustomer,
      total     : data.total,
      diskon    : data.diskon,
      ppn       : data.ppn,
      grandtotal: data.grandtotal,
    },
  });

  await db.jualdtl.deleteMany({ where: { idjual: jual.idjual } });

  await db.jualdtl.createMany({
    data: data.items.map((item, index) => ({
      idjual  : jual.idjual,
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

  await db.bayar.deleteMany({ where: { idjual: jual.idjual } });

  await db.bayar.create({
    data: {
      idjual   : jual.idjual,
      tunai    : data.pembayaran.tunai,
      nontunai : data.pembayaran.nontunai,
      kembalian: data.pembayaran.kembalian,
    },
  });

  return { idjual: jual.idjual, tgltrans: jual.tgltrans, idlokasi: jual.idlokasi };
}

export async function updateStatusPenjualanByKode(
  db         : DatabasePerusahaanClient,
  kodejual   : string,
  alasanbatal: string | null,
): Promise<number> {
  const jual = await db.jual.update({ where: { kodejual }, data: { status: "D", alasanbatal } });

  return jual.idjual;
}
