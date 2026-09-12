export type FilterLaporanPosisiStok = {
  idbarang    ?: number;
  tampilkanNol?: boolean;
  idlokasi    ?: number[];
};

/** Satu baris = satu (Barang x Lokasi) dengan saldo pada tanggal laporan. */
export type BarisLaporanPosisiStok = {
  idbarang  : number;
  namabarang: string;
  satuan    : string;
  namalokasi: string;
  saldo     : number;
};
