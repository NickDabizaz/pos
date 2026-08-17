import type { StatusTransaksi, TransaksiItem } from "@/lib/server/transaksi/types";

export type JenisTransaksiPenjualan = "POS" | "PESANAN";

export type PenjualanItem = TransaksiItem;

export type { StatusTransaksi };

export type Penjualan = {
  kodejual      : string;
  tanggal       : string;
  jenistransaksi: JenisTransaksiPenjualan;
  kodecustomer  : string;
  namacustomer  : string;
  items         : PenjualanItem[];
  total         : number;
  diskon        : number;
  ppn           : number;
  grandtotal    : number;
  status        : StatusTransaksi;
  alasanBatal  ?: string;
};
