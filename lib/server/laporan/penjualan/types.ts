import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type FilterLaporanPenjualan = {
  dari?              : Date;
  sampai?            : Date;
  termasukDibatalkan?: boolean;
};

/** Satu baris = satu `jualdtl`. Nilai level-transaksi diulang identik di tiap baris transaksi itu. */
export type BarisLaporanPenjualan = {
  kodejual    : string;
  tgltrans    : Date;
  namalokasi  : string;
  namacustomer: string;
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
