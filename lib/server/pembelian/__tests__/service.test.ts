import { beforeEach, describe, expect, it } from "vitest";

import { findAllPembelian, resetPembelianStoreForTests } from "@/lib/server/pembelian/repository";
import { createPembelian, generateKodePembelian, getPembelian, updatePembelian } from "@/lib/server/pembelian/service";
import type { Pembelian } from "@/lib/server/pembelian/types";

const newPembelian: Pembelian = {
  kodebeli    : "PB-TEST-0001",
  tanggal     : "2026-08-17",
  kodesupplier: "SUP-0001",
  namasupplier: "PT Sumber Berkah Pangan",
  items       : [
    { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", qty: 10, harga: 55000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 550000 },
  ],
  total     : 550000,
  diskon    : 0,
  ppn       : 0,
  grandtotal: 550000,
  status    : "S",
};

beforeEach(() => {
  resetPembelianStoreForTests();
});

describe("createPembelian", () => {
  it("adds the item and it shows up in findAllPembelian", () => {
    createPembelian(newPembelian);

    expect(findAllPembelian()).toContainEqual(newPembelian);
  });

  it("rejects a kodebeli that already exists", () => {
    createPembelian(newPembelian);

    expect(() => createPembelian(newPembelian)).toThrow(/sudah digunakan/);
  });
});

describe("getPembelian", () => {
  it("returns the matching item", () => {
    createPembelian(newPembelian);

    expect(getPembelian(newPembelian.kodebeli)).toEqual(newPembelian);
  });

  it("throws when the kodebeli does not exist", () => {
    expect(() => getPembelian("PB-MISSING")).toThrow(/tidak ditemukan/);
  });
});

describe("updatePembelian", () => {
  it("replaces the item's fields", () => {
    createPembelian(newPembelian);

    const updated = updatePembelian(newPembelian.kodebeli, {
      ...newPembelian,
      status: "D",
    });

    expect(updated.status).toBe("D");
    expect(findAllPembelian()).toContainEqual({ ...newPembelian, status: "D" });
  });

  it("throws when the kodebeli does not exist", () => {
    expect(() => updatePembelian("PB-MISSING", newPembelian)).toThrow(/tidak ditemukan/);
  });
});

describe("generateKodePembelian", () => {
  it("produces a code following the PB-YYYYMMDD-#### pattern not already used", () => {
    const generated = generateKodePembelian();

    expect(generated).toMatch(/^PB-\d{8}-\d{4}$/);
    expect(findAllPembelian().some((item) => item.kodebeli === generated)).toBe(false);
  });
});
