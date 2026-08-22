import type { Shift } from "@/lib/server/shift/types";

let currentShift: Shift | null = null;

export function getCurrentShift(): Shift | null {
  return currentShift;
}

export function setCurrentShift(shift: Shift): void {
  currentShift = shift;
}

export function resetShiftStoreForTests(): void {
  currentShift = null;
}
