import type { Pembelian } from "@/lib/server/pembelian/types";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

export type { Pembelian };

export type PembelianFormValues = {
  tanggal     : string;
  kodesupplier: string;
  namasupplier: string;
  kodelokasi  : string;
  namalokasi  : string;
  items       : TransaksiItem[];
};

export type PembelianFormErrors = {
  tanggal     ?: string;
  kodesupplier?: string;
  kodelokasi  ?: string;
  items       ?: string;
};

export type PembelianFilter = {
  query        : string;
  tanggalDari  : string;
  tanggalSampai: string;
};
