import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetShiftStoreForTests } from "@/lib/server/shift/repository";
import {
  cancelCloseShift,
  closeShift,
  getActiveShift,
  getShiftForToday,
  NoActiveShiftError,
  openShift,
  recordShiftTransaction,
  ShiftAlreadyClosedTodayError,
  ShiftAlreadyOpenError,
  ShiftNotClosedTodayError,
} from "@/lib/server/shift/service";

beforeEach(() => {
  resetShiftStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getActiveShift", () => {
  it("returns null when no shift has been opened", () => {
    expect(getActiveShift()).toBeNull();
  });
});

describe("openShift", () => {
  it("opens a shift with zeroed sales tallies", () => {
    const shift = openShift({ kasirName: "Budi", modalAwal: 200000 });

    expect(shift.status).toBe("OPEN");
    expect(shift.kasirName).toBe("Budi");
    expect(shift.modalAwal).toBe(200000);
    expect(shift.penjualanTunai).toBe(0);
    expect(shift.penjualanNonTunai).toBe(0);
    expect(shift.jumlahTransaksi).toBe(0);
    expect(getActiveShift()).toEqual(shift);
  });

  it("rejects opening a shift while one is already active", () => {
    openShift({ kasirName: "Budi", modalAwal: 200000 });

    expect(() => openShift({ kasirName: "Sari", modalAwal: 100000 })).toThrow(ShiftAlreadyOpenError);
  });
});

describe("recordShiftTransaction", () => {
  it("accumulates cash sales into penjualanTunai", () => {
    openShift({ kasirName: "Budi", modalAwal: 200000 });

    recordShiftTransaction({ paymentMethod: "TUNAI", grandTotal: 50000 });
    const shift = recordShiftTransaction({ paymentMethod: "TUNAI", grandTotal: 30000 });

    expect(shift.penjualanTunai).toBe(80000);
    expect(shift.penjualanNonTunai).toBe(0);
    expect(shift.jumlahTransaksi).toBe(2);
  });

  it("accumulates non-cash sales into penjualanNonTunai", () => {
    openShift({ kasirName: "Budi", modalAwal: 200000 });

    const shift = recordShiftTransaction({ paymentMethod: "QRIS", grandTotal: 45000 });

    expect(shift.penjualanTunai).toBe(0);
    expect(shift.penjualanNonTunai).toBe(45000);
    expect(shift.jumlahTransaksi).toBe(1);
  });

  it("throws when there is no active shift", () => {
    expect(() => recordShiftTransaction({ paymentMethod: "TUNAI", grandTotal: 1000 })).toThrow(
      NoActiveShiftError,
    );
  });
});

describe("closeShift", () => {
  it("closes the active shift and records the physical cash count", () => {
    openShift({ kasirName: "Budi", modalAwal: 200000 });
    recordShiftTransaction({ paymentMethod: "TUNAI", grandTotal: 50000 });

    const closed = closeShift({ kasAktual: 250000, catatan: "Pas" });

    expect(closed.status).toBe("CLOSED");
    expect(closed.kasAktual).toBe(250000);
    expect(closed.catatan).toBe("Pas");
    expect(closed.closedAt).toBeDefined();
    expect(getActiveShift()).toBeNull();
  });

  it("throws when there is no active shift", () => {
    expect(() => closeShift({ kasAktual: 100000 })).toThrow(NoActiveShiftError);
  });
});

describe("one-shift-per-day rule", () => {
  it("rejects opening a new shift after today's shift has been closed", () => {
    openShift({ kasirName: "Budi", modalAwal: 200000 });
    closeShift({ kasAktual: 200000 });

    expect(() => openShift({ kasirName: "Sari", modalAwal: 100000 })).toThrow(
      ShiftAlreadyClosedTodayError,
    );
  });

  it("allows opening a brand new shift once the closed shift is from a previous day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T10:00:00.000Z"));
    openShift({ kasirName: "Budi", modalAwal: 200000 });
    closeShift({ kasAktual: 200000 });

    vi.setSystemTime(new Date("2026-08-17T09:00:00.000Z"));
    const shift = openShift({ kasirName: "Sari", modalAwal: 100000 });

    expect(shift.kasirName).toBe("Sari");
    expect(shift.status).toBe("OPEN");
  });

  describe("getShiftForToday", () => {
    it("returns null when no shift has been opened today", () => {
      expect(getShiftForToday()).toBeNull();
    });

    it("returns the closed shift when it was opened earlier today", () => {
      openShift({ kasirName: "Budi", modalAwal: 200000 });
      const closed = closeShift({ kasAktual: 200000 });

      expect(getShiftForToday()).toEqual(closed);
    });

    it("returns null when the last shift was opened on a previous day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-16T10:00:00.000Z"));
      openShift({ kasirName: "Budi", modalAwal: 200000 });
      closeShift({ kasAktual: 200000 });

      vi.setSystemTime(new Date("2026-08-17T09:00:00.000Z"));
      expect(getShiftForToday()).toBeNull();
    });
  });

  describe("cancelCloseShift", () => {
    it("resumes today's closed shift, keeping accumulated sales and clearing close-out fields", () => {
      openShift({ kasirName: "Budi", modalAwal: 200000 });
      recordShiftTransaction({ paymentMethod: "TUNAI", grandTotal: 50000 });
      const closed = closeShift({ kasAktual: 250000, catatan: "Pas" });

      const resumed = cancelCloseShift();

      expect(resumed.status).toBe("OPEN");
      expect(resumed.shiftCode).toBe(closed.shiftCode);
      expect(resumed.penjualanTunai).toBe(50000);
      expect(resumed.closedAt).toBeUndefined();
      expect(resumed.kasAktual).toBeUndefined();
      expect(resumed.catatan).toBeUndefined();
      expect(getActiveShift()).toEqual(resumed);
    });

    it("throws when there is no closure to cancel today", () => {
      expect(() => cancelCloseShift()).toThrow(ShiftNotClosedTodayError);
    });

    it("throws when the only closed shift is from a previous day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-16T10:00:00.000Z"));
      openShift({ kasirName: "Budi", modalAwal: 200000 });
      closeShift({ kasAktual: 200000 });

      vi.setSystemTime(new Date("2026-08-17T09:00:00.000Z"));
      expect(() => cancelCloseShift()).toThrow(ShiftNotClosedTodayError);
    });

    it("throws when a shift is already open", () => {
      openShift({ kasirName: "Budi", modalAwal: 200000 });

      expect(() => cancelCloseShift()).toThrow(ShiftNotClosedTodayError);
    });
  });
});
