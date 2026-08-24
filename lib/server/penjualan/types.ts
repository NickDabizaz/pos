import type { PpnMode, StatusTransaksi, TransaksiItem } from "@/lib/server/transaksi/types";

export type JenisTransaksiPenjualan = "POS" | "PESANAN";

export type PenjualanItem = TransaksiItem;

export type { PpnMode, StatusTransaksi };

export type PembayaranPenjualan = {
  tunai    : number;
  nontunai : number;
  kembalian: number;
};

export type Penjualan = {
  kodejual      : string;
  tanggal       : string;
  jenistransaksi: JenisTransaksiPenjualan;
  kodecustomer  : string;
  namacustomer  : string;
  kodelokasi    : string;
  namalokasi    : string;
  items         : PenjualanItem[];
  total         : number;
  diskon        : number;
  ppn           : number;
  grandtotal    : number;
  status        : StatusTransaksi;
  alasanbatal   : string | null;
  pembayaran    : PembayaranPenjualan;
};

export type CreatePenjualanItemInput = {
  kodebarang: string;
  qty       : number;
  harga     : number;
  pakaiPpn  : PpnMode;
  diskon    : number;
};

export type CreatePenjualanInput = {
  tanggal       : string;
  jenistransaksi: JenisTransaksiPenjualan;
  kodecustomer  : string;
  kodelokasi    : string;
  items         : CreatePenjualanItemInput[];
  pembayaran   ?: { tunai: number; nontunai: number };
};

export type UpdatePenjualanInput = {
  kodecustomer: string;
  items       : CreatePenjualanItemInput[];
  pembayaran ?: { tunai: number; nontunai: number };
};
