import { beforeEach, describe, expect, it } from "vitest";

import { resetPembelianStoreForTests } from "@/lib/server/pembelian/repository";
import {
  createPembelian,
  DuplicateKodeBeliError,
  generateKodePembelian,
  getPembelian,
  listPembelian,
  PembelianNotFoundError,
  updatePembelian,
} from "@/lib/server/pembelian/service";
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
  it("adds the item and it shows up in listPembelian", () => {
    createPembelian(newPembelian);

    expect(listPembelian()).toContainEqual(newPembelian);
  });

  it("rejects a kodebeli that already exists", () => {
    createPembelian(newPembelian);

    expect(() => createPembelian(newPembelian)).toThrow(DuplicateKodeBeliError);
  });
});

describe("getPembelian", () => {
  it("returns the matching item", () => {
    createPembelian(newPembelian);

    expect(getPembelian(newPembelian.kodebeli)).toEqual(newPembelian);
  });

  it("throws when the kodebeli does not exist", () => {
    expect(() => getPembelian("PB-MISSING")).toThrow(PembelianNotFoundError);
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
    expect(listPembelian()).toContainEqual({ ...newPembelian, status: "D" });
  });

  it("throws when the kodebeli does not exist", () => {
    expect(() => updatePembelian("PB-MISSING", newPembelian)).toThrow(PembelianNotFoundError);
  });
});

describe("generateKodePembelian", () => {
  it("produces a code following the PB-YYYYMMDD-#### pattern not already used", () => {
    const generated = generateKodePembelian();

    expect(generated).toMatch(/^PB-\d{8}-\d{4}$/);
    expect(listPembelian().some((item) => item.kodebeli === generated)).toBe(false);
  });
});
