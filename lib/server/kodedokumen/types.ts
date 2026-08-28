export const MODUL_KODE_DOKUMEN = ["LOKASI", "BARANG", "CUSTOMER", "SUPPLIER", "JUAL", "BELI", "KAS", "OPNAME STOK"] as const;

export type ModulKodeDokumen = (typeof MODUL_KODE_DOKUMEN)[number];

export type KonfigurasiKodeDokumen = {
  awalan      : string;
  pakaitanggal: "0" | "1";
  panjangnomor: number;
};
