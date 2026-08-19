import type { Kas } from "@/app/kas/lib/types";

export type KasSummary = {
  totalMasuk : number;
  totalKeluar: number;
  saldoBersih: number;
};

export function calculateKasSummary(items: Kas[]): KasSummary {
  const active = items.filter((item) => item.status !== "D");
  const totalMasuk = active.filter((item) => item.jenis === "MASUK").reduce((sum, item) => sum + item.nominal, 0);
  const totalKeluar = active.filter((item) => item.jenis === "KELUAR").reduce((sum, item) => sum + item.nominal, 0);

  return {
    totalMasuk,
    totalKeluar,
    saldoBersih: totalMasuk - totalKeluar,
  };
}
