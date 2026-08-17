export type Barang = {
  kodebarang: string;
  namabarang: string;
  barcode   : string;
  satuan    : string;
  hargabeli : number;
  hargajual : number;
  pakaiStok : boolean;
  status    : 0 | 1;
};
