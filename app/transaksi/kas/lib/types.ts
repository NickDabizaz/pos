import type { JenisKas, Kas, KasRincian } from "@/lib/server/kas/types";

export type { JenisKas, Kas, KasRincian };

export type KasFormValues = {
  tanggal   : string;
  jenis     : JenisKas;
  kodelokasi: string;
  namalokasi: string;
  rincian   : KasRincian[];
};

export type KasFormErrors = {
  tanggal   ?: string;
  kodelokasi?: string;
  rincian   ?: string;
};

export type KasFilter = {
  query        : string;
  jenis        : JenisKas | "SEMUA";
  kodelokasi   : string | "SEMUA";
  tanggalDari  : string;
  tanggalSampai: string;
};
