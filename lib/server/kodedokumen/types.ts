export const MODUL_KODE_DOKUMEN = ["lokasi", "barang", "customer", "supplier", "jual", "beli", "kas"] as const;

export type ModulKodeDokumen = (typeof MODUL_KODE_DOKUMEN)[number];

export type KonfigurasiKodeDokumen = {
  awalan      : string;
  pakaitanggal: "0" | "1";
  panjangnomor: number;
};
