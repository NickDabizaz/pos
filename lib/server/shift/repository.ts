import type { Shift } from "@/lib/server/shift/types";

let currentShift: Shift | null = null;

export function getCurrentShift(): Shift | null {
  return currentShift;
}

export function setCurrentShift(shift: Shift): void {
  currentShift = shift;
}

/** Test-only: reset the in-memory mock store back to its empty state. */
export function resetShiftStoreForTests(): void {
  currentShift = null;
}
