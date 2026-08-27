export type ItemConfig = {
  config: string;
  nilai : string;
};

export type KelompokConfig = {
  modul: string;
  items: ItemConfig[];
};

export type ConfigRow = {
  modul : string;
  config: string;
  nilai : string;
};

export type Tema = "LIGHT" | "DARK";

export type Kelompok = "GLOBAL" | "MASTER" | "TRANSAKSI";

export type TipeInput = "teks" | "pilihan";

export type MetaKunci = {
  label   : string;
  tipe    : TipeInput;
  pilihan?: readonly string[];
};
