export type Barang = {
  idbarang  : number;
  kodebarang: string;
  namabarang: string;
  barcode   : string | null;
  satuan    : string;
  hargabeli : number;
  hargajual : number;
  pakaistok : boolean;
  status    : number;
};

export type CreateBarangInput = {
  namabarang: string;
  barcode?  : string | null;
  satuan    : string;
  hargabeli : number;
  hargajual : number;
  pakaistok?: boolean;
};

export type UpdateBarangInput = {
  namabarang?: string;
  barcode?   : string | null;
  satuan?    : string;
  hargabeli? : number;
  hargajual? : number;
  pakaistok? : boolean;
  status?    : 0 | 1;
};
