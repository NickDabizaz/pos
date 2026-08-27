export type ConfigRow = {
  modul : string;
  config: string;
  nilai : string;
};

/** Pasangan kunci-nilai satu baris config, tanpa modulnya. */
export type ItemConfig = {
  config: string;
  nilai : string;
};

export type KelompokConfig = {
  modul: string;
  items: ItemConfig[];
};

export type UpdateConfigInput = {
  modul : string;
  config: string;
  nilai : string;
};

export type Tema = "LIGHT" | "DARK";
