import type { PpnMode, StatusTransaksi, TransaksiItem } from "@/lib/server/transaksi/types";

export type PembelianItem = TransaksiItem;

export type { StatusTransaksi };

export type Pembelian = {
  kodebeli    : string;
  tanggal     : string;
  kodesupplier: string;
  namasupplier: string;
  kodelokasi  : string;
  namalokasi  : string;
  items       : PembelianItem[];
  total       : number;
  diskon      : number;
  ppn         : number;
  grandtotal  : number;
  status      : StatusTransaksi;
  alasanbatal : string | null;
};

export type CreatePembelianItemInput = {
  kodebarang: string;
  qty       : number;
  harga     : number;
  pakaiPpn  : PpnMode;
  diskon    : number;
};

export type CreatePembelianInput = {
  tanggal     : string;
  kodesupplier: string;
  kodelokasi  : string;
  items       : CreatePembelianItemInput[];
};
