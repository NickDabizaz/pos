import type { Shift } from "@/app/tutup-kasir/lib/types";

export type SelisihStatus = "PAS" | "SURPLUS" | "MINUS";

/**
 * The amount of cash that should physically be in the drawer: the shift's
 * opening float plus everything taken in as cash sales.
 */
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
