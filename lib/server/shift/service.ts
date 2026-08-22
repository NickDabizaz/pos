import { getCurrentShift, setCurrentShift } from "@/lib/server/shift/repository";
import type {
  CloseShiftInput,
  OpenShiftInput,
  RecordShiftTransactionInput,
  Shift,
} from "@/lib/server/shift/types";

export class ShiftAlreadyOpenError extends Error {}
export class NoActiveShiftError extends Error {}
export class ShiftAlreadyClosedTodayError extends Error {}
export class ShiftNotClosedTodayError extends Error {}

function generateShiftCode(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SFT-${dateStr}-${randomSuffix}`;
}

function isSameDay(isoDate: string, reference: Date): boolean {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function getActiveShift(): Shift | null {
  const shift = getCurrentShift();
  return shift && shift.status === "OPEN" ? shift : null;
}

export function getShiftForToday(): Shift | null {
  const shift = getCurrentShift();
  return shift && isSameDay(shift.openedAt, new Date()) ? shift : null;
}

export function openShift(input: OpenShiftInput): Shift {
  if (getActiveShift()) {
    throw new ShiftAlreadyOpenError("Shift sudah dibuka, tutup shift sebelumnya terlebih dahulu");
  }

  if (getShiftForToday()) {
    throw new ShiftAlreadyClosedTodayError(
      "Shift hari ini sudah ditutup. Batalkan penutupan shift untuk melanjutkan, bukan membuka shift baru.",
    );
  }

  const shift: Shift = {
    shiftCode        : generateShiftCode(),
    kasirName        : input.kasirName,
    modalAwal        : input.modalAwal,
    openedAt         : new Date().toISOString(),
    penjualanTunai   : 0,
    penjualanNonTunai: 0,
    jumlahTransaksi  : 0,
    status           : "OPEN",
  };

  setCurrentShift(shift);
  return shift;
}

export function recordShiftTransaction(input: RecordShiftTransactionInput): Shift {
  const shift = getActiveShift();

  if (!shift) {
    throw new NoActiveShiftError("Tidak ada shift yang sedang aktif");
  }

  const updated: Shift = {
    ...shift,
    penjualanTunai   : shift.penjualanTunai + (input.paymentMethod === "TUNAI" ? input.grandTotal : 0),
    penjualanNonTunai: shift.penjualanNonTunai + (input.paymentMethod === "TUNAI" ? 0 : input.grandTotal),
    jumlahTransaksi  : shift.jumlahTransaksi + 1,
  };

  setCurrentShift(updated);
  return updated;
}

export function cancelCloseShift(): Shift {
  if (getActiveShift()) {
    throw new ShiftNotClosedTodayError("Shift sedang aktif, tidak ada penutupan yang perlu dibatalkan");
  }

  const shift = getShiftForToday();

  if (!shift) {
    throw new ShiftNotClosedTodayError("Tidak ada penutupan shift hari ini yang bisa dibatalkan");
  }

  const resumed: Shift = {
    ...shift,
    status   : "OPEN",
    closedAt : undefined,
    kasAktual: undefined,
    catatan  : undefined,
  };

  setCurrentShift(resumed);
  return resumed;
}

export function closeShift(input: CloseShiftInput): Shift {
  const shift = getActiveShift();

  if (!shift) {
    throw new NoActiveShiftError("Tidak ada shift yang sedang aktif");
  }

  const updated: Shift = {
    ...shift,
    closedAt : new Date().toISOString(),
    kasAktual: input.kasAktual,
    catatan  : input.catatan,
    status   : "CLOSED",
  };

  setCurrentShift(updated);
  return updated;
}
