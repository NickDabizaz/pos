import type { SaldoJurnal } from "@/lib/server/jurnal/types";

export type FilterLaporanJurnal = {
  kodetrans?: string;
  dari?     : Date;
  sampai?   : Date;
};

/** Satu baris = satu baris `jurnal`, ditampilkan apa adanya. */
export type BarisLaporanJurnal = {
  kodetrans     : string;
  tgltrans      : Date;
  jenistransaksi: string;
  namalokasi    : string;
  urutan        : number;
  saldo         : SaldoJurnal;
  amount        : number;
  catatan       : string;
};
