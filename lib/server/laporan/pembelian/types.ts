import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type FilterLaporanPembelian = {
  dari              ?: Date;
  sampai            ?: Date;
  termasukDibatalkan?: boolean;
  idlokasi          ?: number[];
};

export type DetailLaporanPembelian = {
  namabarang: string;
  satuan    : string;
  qty       : number;
  harga     : number;
  subtotal  : number;
  ppnBaris  : number;
};

/** Satu transaksi `beli` beserta detail-detailnya — laporan dikelompokkan per transaksi. */
export type TransaksiLaporanPembelian = {
  kodebeli    : string;
  tgltrans    : Date;
  namalokasi  : string;
  namasupplier: string;
  total       : number;
  diskon      : number;
  ppn         : number;
  grandtotal  : number;
  status      : StatusTransaksi;
  detail      : DetailLaporanPembelian[];
};
