import type { MetaKunci } from "@/app/pengaturan/lib/types";

const META_KUNCI: Record<string, MetaKunci> = {
  awalan      : { label: "Awalan Kode", tipe: "teks" },
  pakaitanggal: { label: "Pakai Tanggal", pilihan: ["0", "1"], tipe: "pilihan" },
  panjangnomor: { label: "Panjang Nomor", tipe: "teks" },
  persentase  : { label: "Persentase PPN", tipe: "teks" },
  status      : { label: "Status PPN", pilihan: ["0", "1"], tipe: "pilihan" },
  tema        : { label: "Tema Tampilan", pilihan: ["terang", "gelap"], tipe: "pilihan" },
};

const LABEL_MODUL: Record<string, string> = {
  barang  : "Barang",
  beli    : "Pembelian",
  customer: "Customer",
  jual    : "Penjualan",
  kas     : "Kas",
  lokasi  : "Lokasi",
  ppn     : "PPN",
  supplier: "Supplier",
  tampilan: "Tampilan",
};

export function metaKunci(config: string): MetaKunci {
  return META_KUNCI[config] ?? { label: config, tipe: "teks" };
}

export function labelModul(modul: string): string {
  return LABEL_MODUL[modul] ?? modul;
}
