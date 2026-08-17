import { beforeEach, describe, expect, it } from "vitest";

import { resetShiftStoreForTests } from "@/lib/server/shift/repository";
import {
  closeShift,
  getActiveShift,
  NoActiveShiftError,
  openShift,
  recordShiftTransaction,
  ShiftAlreadyOpenError,
} from "@/lib/server/shift/service";

beforeEach(() => {
  resetShiftStoreForTests();
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
