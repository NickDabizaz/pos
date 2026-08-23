export type Barang = {
  idbarang  : number;
  kodebarang: string;
  namabarang: string;
  barcode   : string;
  satuan    : string;
  hargabeli : number;
  hargajual : number;
  pakaistok : boolean;
  status    : number;
};

export type BarangFormErrors = Partial<Record<keyof Barang, string>>;
