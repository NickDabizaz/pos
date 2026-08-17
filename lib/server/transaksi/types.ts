export type PpnMode = "TIDAK" | "EXCLUDE" | "INCLUDE";

export type StatusTransaksi = "S" | "D";

export type TransaksiItem = {
  kodebarang: string;
  namabarang: string;
  satuan    : string;
  qty       : number;
  harga     : number;
  pakaiPpn  : PpnMode;
  diskon    : number;
  ppn       : number;
  subtotal  : number;
};
