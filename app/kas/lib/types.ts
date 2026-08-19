import type { JenisKas, Kas, StatusTransaksi } from "@/lib/server/kas/types";

export type { JenisKas, Kas, StatusTransaksi };

export type KasFormErrors = {
  tanggal   ?: string;
  kodelokasi?: string;
  nominal   ?: string;
  keterangan?: string;
};

export type KasFilter = {
  query        : string;
  jenis        : JenisKas | "SEMUA";
  kodelokasi   : string | "SEMUA";
  tanggalDari  : string;
  tanggalSampai: string;
};
