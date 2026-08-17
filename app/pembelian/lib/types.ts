import type { Pembelian, PembelianItem, StatusTransaksi } from "@/lib/server/pembelian/types";

export type { Pembelian, PembelianItem, StatusTransaksi };

export type PembelianFormErrors = {
  tanggal     ?: string;
  kodesupplier?: string;
  items       ?: string;
};

export type PembelianFilter = {
  query        : string;
  tanggalDari  : string;
  tanggalSampai: string;
};
