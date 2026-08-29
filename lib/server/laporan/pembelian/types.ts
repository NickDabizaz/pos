import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type FilterLaporanPembelian = {
  dari?              : Date;
  sampai?            : Date;
  termasukDibatalkan?: boolean;
};

/** Satu baris = satu `belidtl`. Nilai level-transaksi diulang identik di tiap baris transaksi itu. */
export type BarisLaporanPembelian = {
  kodebeli    : string;
  tgltrans    : Date;
  namalokasi  : string;
  namasupplier: string;
  total       : number;
  diskon      : number;
  ppn         : number;
  grandtotal  : number;
  status      : StatusTransaksi;
  namabarang  : string;
  satuan      : string;
  qty         : number;
  harga       : number;
  subtotal    : number;
  ppnBaris    : number;
};
