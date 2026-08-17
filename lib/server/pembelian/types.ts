import type { StatusTransaksi, TransaksiItem } from "@/lib/server/transaksi/types";

export type PembelianItem = TransaksiItem;

export type { StatusTransaksi };

export type Pembelian = {
  kodebeli    : string;
  tanggal     : string;
  kodesupplier: string;
  namasupplier: string;
  items       : PembelianItem[];
  total       : number;
  diskon      : number;
  ppn         : number;
  grandtotal  : number;
  status      : StatusTransaksi;
  alasanBatal?: string;
};
