import type { Shift } from "@/app/tutup-kasir/lib/types";

export type SelisihStatus = "PAS" | "SURPLUS" | "MINUS";

export function calculateTotalKasDiharapkan(shift: Pick<Shift, "modalawal" | "totaltunai">): number {
  return (shift.modalawal ?? 0) + (shift.totaltunai ?? 0);
}

export function calculateSelisih(kasaktual: number, totalKasDiharapkan: number): number {
  return kasaktual - totalKasDiharapkan;
}

export function getSelisihStatus(selisih: number): SelisihStatus {
  if (selisih === 0) return "PAS";
  return selisih > 0 ? "SURPLUS" : "MINUS";
}
