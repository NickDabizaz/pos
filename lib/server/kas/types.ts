import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type JenisKas = "MASUK" | "KELUAR";

export type { StatusTransaksi };

export type Kas = {
  kodekas     : string;
  tanggal     : string;
  jenis       : JenisKas;
  kodelokasi  : string;
  namalokasi  : string;
  nominal     : number;
  keterangan  : string;
  status      : StatusTransaksi;
  alasanBatal?: string;
};
