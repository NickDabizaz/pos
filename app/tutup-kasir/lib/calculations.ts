import type { Shift } from "@/app/tutup-kasir/lib/types";

export type SelisihStatus = "PAS" | "SURPLUS" | "MINUS";

export function calculateTotalKasDiharapkan(shift: Pick<Shift, "modalAwal" | "penjualanTunai">): number {
  return shift.modalAwal + shift.penjualanTunai;
}

export function calculateSelisih(kasAktual: number, totalKasDiharapkan: number): number {
  return kasAktual - totalKasDiharapkan;
}

export function getSelisihStatus(selisih: number): SelisihStatus {
  if (selisih === 0) return "PAS";
  return selisih > 0 ? "SURPLUS" : "MINUS";
}
