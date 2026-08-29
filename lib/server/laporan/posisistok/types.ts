export type FilterLaporanPosisiStok = {
  idbarang?    : number;
  tampilkanNol?: boolean;
};

/** Satu baris = satu (Barang x Lokasi) dengan saldo saat ini. */
export type BarisLaporanPosisiStok = {
  idbarang  : number;
  namabarang: string;
  satuan    : string;
  namalokasi: string;
  saldo     : number;
};
