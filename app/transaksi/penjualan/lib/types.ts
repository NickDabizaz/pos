import type { JenisTransaksiPenjualan, Penjualan } from "@/lib/server/penjualan/types";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

export type { JenisTransaksiPenjualan, Penjualan };

export type PenjualanFormValues = {
  tanggal     : string;
  kodecustomer: string;
  namacustomer: string;
  kodelokasi  : string;
  namalokasi  : string;
  items       : TransaksiItem[];
};

export type PenjualanFormErrors = {
  tanggal     ?: string;
  kodecustomer?: string;
  kodelokasi  ?: string;
  items       ?: string;
};

export type PenjualanFilter = {
  query         : string;
  jenistransaksi: JenisTransaksiPenjualan | "SEMUA";
  tanggalDari   : string;
  tanggalSampai : string;
};
