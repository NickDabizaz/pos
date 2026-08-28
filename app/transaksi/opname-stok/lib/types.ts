import type { OpnameStok } from "@/lib/server/opnamestok/types";

export type { OpnameStok };

export type OpnameStokFormRow = {
  kodebarang: string;
  namabarang: string;
  satuan    : string;
  jmlsistem : number;
  jmlfisik  : number;
};

export type OpnameStokFormValues = {
  tanggal   : string;
  kodelokasi: string;
  namalokasi: string;
  rows      : OpnameStokFormRow[];
};

export type OpnameStokFormErrors = {
  tanggal   ?: string;
  kodelokasi?: string;
  rows      ?: string;
};

export type OpnameStokStatusFilter = "SEMUA" | "S" | "D";

export type OpnameStokFilter = {
  query        : string;
  tanggalDari  : string;
  tanggalSampai: string;
  status       : OpnameStokStatusFilter;
};
