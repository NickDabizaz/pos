export type FilterLaporanKartuStok = {
  idbarang?: number;
};

/** Satu baris = satu `kartustok`, dengan saldo berjalan sudah dihitung dari nol per Barang. */
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
  baris     : BarisMutasiKartuStok[];
};
