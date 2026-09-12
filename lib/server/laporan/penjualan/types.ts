import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type FilterLaporanPenjualan = {
  dari              ?: Date;
  sampai            ?: Date;
  termasukDibatalkan?: boolean;
  idlokasi          ?: number[];
};

/** Satu baris detail = satu `jualdtl`. */
export type DetailLaporanPenjualan = {
  namabarang: string;
  satuan    : string;
  qty       : number;
  harga     : number;
  subtotal  : number;
  ppnBaris  : number;
};

/** Satu transaksi `jual` beserta detail-detailnya — laporan dikelompokkan per transaksi. */
export type TransaksiLaporanPenjualan = {
  kodejual    : string;
  tgltrans    : Date;
  namalokasi  : string;
  namacustomer: string;
  total       : number;
  diskon      : number;
  ppn         : number;
  grandtotal  : number;
  status      : StatusTransaksi;
  detail      : DetailLaporanPenjualan[];
};
