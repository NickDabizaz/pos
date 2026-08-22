import { getCurrentShift, setCurrentShift } from "@/lib/server/shift/repository";
import type {
  CloseShiftInput,
  OpenShiftInput,
  RecordShiftTransactionInput,
  Shift,
} from "@/lib/server/shift/types";

function isSameDay(isoDate: string, reference: Date): boolean {
  const date = new Date(isoDate);
  const sama =
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate();

  return sama;
}

export function getActiveShift(): Shift | null {
  const shift = getCurrentShift();
  const active = shift && shift.status === "OPEN" ? shift : null;

  return active;
}

export function getShiftForToday(): Shift | null {
  const shift = getCurrentShift();
  const today = shift && isSameDay(shift.openedAt, new Date()) ? shift : null;

  return today;
}

export function openShift(input: OpenShiftInput): Shift {
  if (getActiveShift()) {
    throw new Error("Shift sudah dibuka, tutup shift sebelumnya terlebih dahulu", { cause: "SHIFT_CONFLICT" });
  }

  if (getShiftForToday()) {
    throw new Error(
      "Shift hari ini sudah ditutup. Batalkan penutupan shift untuk melanjutkan, bukan membuka shift baru.",
      { cause: "SHIFT_CONFLICT" },
    );
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  const shift: Shift = {
    shiftCode        : `SFT-${dateStr}-${randomSuffix}`,
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
    throw new Error("Tidak ada shift yang sedang aktif", { cause: "SHIFT_CONFLICT" });
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
    throw new Error("Shift sedang aktif, tidak ada penutupan yang perlu dibatalkan", { cause: "SHIFT_CONFLICT" });
  }

  const shift = getShiftForToday();

  if (!shift) {
    throw new Error("Tidak ada penutupan shift hari ini yang bisa dibatalkan", { cause: "SHIFT_CONFLICT" });
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
    throw new Error("Tidak ada shift yang sedang aktif", { cause: "SHIFT_CONFLICT" });
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
