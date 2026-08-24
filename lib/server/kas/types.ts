import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type { StatusTransaksi };

export type JenisKas = "MASUK" | "KELUAR";

export type KasRincian = {
  keterangan: string;
  nominal   : number;
};

export type Kas = {
  kodekas    : string;
  tanggal    : string;
  jenis      : JenisKas;
  kodelokasi : string;
  namalokasi : string;
  rincian    : KasRincian[];
  grandtotal : number;
  status     : StatusTransaksi;
  alasanbatal: string | null;
};

export type CreateKasRincianInput = {
  keterangan: string;
  nominal   : number;
};

export type CreateKasInput = {
  tanggal   : string;
  jenis     : JenisKas;
  kodelokasi: string;
  rincian   : CreateKasRincianInput[];
};
