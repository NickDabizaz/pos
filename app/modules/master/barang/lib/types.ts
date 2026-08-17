export type Barang = {
  kodebarang: string;
  namabarang: string;
  kategori  : string;
  satuan    : string;
  hargabeli : number;
  hargajual : number;
  stok      : number;
};

export type BarangFormErrors = Partial<Record<keyof Barang, string>>;
