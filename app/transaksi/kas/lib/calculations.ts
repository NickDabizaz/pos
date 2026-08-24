import type { Kas } from "@/app/transaksi/kas/lib/types";

export type KasSummary = {
  totalMasuk : number;
  totalKeluar: number;
  saldoBersih: number;
};

export function calculateKasSummary(items: Kas[]): KasSummary {
  const aktif = items.filter((item) => item.status !== "D");

  const totalMasuk = aktif.filter((item) => item.jenis === "MASUK").reduce((sum, item) => sum + item.grandtotal, 0);
  const totalKeluar = aktif.filter((item) => item.jenis === "KELUAR").reduce((sum, item) => sum + item.grandtotal, 0);

  return {
    totalMasuk,
    totalKeluar,
    saldoBersih: totalMasuk - totalKeluar,
  };
}
