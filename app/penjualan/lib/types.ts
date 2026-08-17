import type { JenisTransaksiPenjualan, Penjualan, PenjualanItem, StatusTransaksi } from "@/lib/server/penjualan/types";

export type { JenisTransaksiPenjualan, Penjualan, PenjualanItem, StatusTransaksi };

export type PenjualanFormErrors = {
  tanggal     ?: string;
  kodecustomer?: string;
  items       ?: string;
};

export type PenjualanFilter = {
  query         : string;
  jenistransaksi: JenisTransaksiPenjualan | "SEMUA";
  tanggalDari   : string;
  tanggalSampai : string;
};
