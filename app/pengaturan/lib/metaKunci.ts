import type { Kelompok, MetaKunci } from "@/app/pengaturan/lib/types";

const META_KUNCI: Record<string, MetaKunci> = {
  AWALAN      : { label: "Awalan Kode", tipe: "teks" },
  PAKAITANGGAL: { label: "Pakai Tanggal", pilihan: ["0", "1"], tipe: "pilihan" },
  PANJANGNOMOR: { label: "Panjang Nomor", tipe: "teks" },
  PERSENTASE  : { label: "Persentase PPN", tipe: "teks" },
  STATUS      : { label: "Status PPN", pilihan: ["0", "1"], tipe: "pilihan" },
  TEMA        : { label: "Tema Tampilan", pilihan: ["LIGHT", "DARK"], tipe: "pilihan" },
};

const LABEL_MODUL: Record<string, string> = {
  BARANG  : "Barang",
  BELI    : "Pembelian",
  CUSTOMER: "Customer",
  JUAL    : "Penjualan",
  KAS     : "Kas",
  LOKASI  : "Lokasi",
  PPN     : "PPN",
  SUPPLIER: "Supplier",
  TAMPILAN: "Tampilan",
};

const LABEL_PILIHAN: Record<string, string> = {
  LIGHT: "Light Mode",
  DARK : "Dark Mode",
};

export const KELOMPOK_URUT: Kelompok[] = ["GLOBAL", "MASTER", "TRANSAKSI"];

/**
 * Satu-satunya sumber keanggotaan + urutan tampilan modul per kelompok tab.
 * `KELOMPOK_MODUL` (modul -> kelompok) diturunkan dari sini, bukan ditulis ulang.
 */
export const URUT_MODUL_KODE: Record<Kelompok, string[]> = {
  GLOBAL   : ["PPN", "TAMPILAN"],
  MASTER   : ["LOKASI", "BARANG", "CUSTOMER", "SUPPLIER"],
  TRANSAKSI: ["JUAL", "BELI", "KAS"],
};

const KELOMPOK_MODUL: Record<string, Kelompok> = Object.fromEntries(
  KELOMPOK_URUT.flatMap((kelompok) => URUT_MODUL_KODE[kelompok].map((modul) => [modul, kelompok])),
);

export const KUNCI_KODE_DOKUMEN = ["AWALAN", "PAKAITANGGAL", "PANJANGNOMOR"] as const;

export function kunciBaris(modul: string, config: string): string {
  return `${modul}/${config}`;
}

export function metaKunci(config: string): MetaKunci {
  const meta = META_KUNCI[config] ?? { label: config, tipe: "teks" as const };

  return meta;
}

export function labelModul(modul: string): string {
  const label = LABEL_MODUL[modul] ?? modul;

  return label;
}

export function labelPilihan(nilai: string): string {
  const label = LABEL_PILIHAN[nilai] ?? nilai;

  return label;
}

export function kelompokDari(modul: string): Kelompok {
  const kelompok = KELOMPOK_MODUL[modul] ?? "GLOBAL";

  return kelompok;
}
