import type { JenisKas } from "@/lib/server/kas/types";
import type { StatusTransaksi } from "@/lib/server/transaksi/types";

export type FilterLaporanKas = {
  dari?              : Date;
  sampai?            : Date;
  termasukDibatalkan?: boolean;
};

/** Satu baris = satu `kasdtl`. Nilai level-transaksi diulang identik di tiap baris transaksi itu. */
export type BarisLaporanKas = {
  kodekas   : string;
  tgltrans  : Date;
  namalokasi: string;
  jenis     : JenisKas;
  grandtotal: number;
  status    : StatusTransaksi;
  keterangan: string;
  nominal   : number;
};
