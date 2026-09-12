export type FilterLaporanKartuStok = {
  idbarang?: number;
  dari    ?: Date;
  sampai  ?: Date;
  idlokasi?: number[];
};

/** Satu baris = satu `kartustok` dalam periode, saldo berjalan meneruskan Saldo Awal. */
export type BarisMutasiKartuStok = {
  tgltrans      : Date;
  kodetrans     : string;
  jenistransaksi: string;
  namalokasi    : string;
  masuk         : number | null;
  keluar        : number | null;
  saldoBerjalan : number;
  catatan       : string;
};

export type GrupLaporanKartuStok = {
  idbarang  : number;
  namabarang: string;
  satuan    : string;
  saldoAwal : number;
  saldoAkhir: number;
  baris     : BarisMutasiKartuStok[];
};
