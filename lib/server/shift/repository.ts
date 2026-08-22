import type { Shift } from "@/lib/server/shift/types";

let currentShift: Shift | null = null;

export function getCurrentShift(): Shift | null {
  const shift = currentShift;

  return shift;
}

export function setCurrentShift(shift: Shift): void {
  currentShift = shift;
}

export function resetShiftStoreForTests(): void {
  currentShift = null;
}
