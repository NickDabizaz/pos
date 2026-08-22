import { beforeEach, describe, expect, it } from "vitest";

import { findAllPenjualan, resetPenjualanStoreForTests } from "@/lib/server/penjualan/repository";
import { createPenjualan, generateKodePenjualan, getPenjualan, updatePenjualan } from "@/lib/server/penjualan/service";
import type { Penjualan } from "@/lib/server/penjualan/types";

const newPenjualan: Penjualan = {
  kodejual      : "PJ-TEST-0001",
  tanggal       : "2026-08-17",
  jenistransaksi: "PESANAN",
  kodecustomer  : "CUST-0001",
  namacustomer  : "Budi Santoso",
  items         : [
    { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", qty: 2, harga: 65000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 130000 },
  ],
  total     : 130000,
  diskon    : 0,
  ppn       : 0,
  grandtotal: 130000,
  status    : "S",
};

beforeEach(() => {
  resetPenjualanStoreForTests();
});

describe("createPenjualan", () => {
  it("adds the item and it shows up in findAllPenjualan", () => {
    createPenjualan(newPenjualan);

    expect(findAllPenjualan()).toContainEqual(newPenjualan);
  });

  it("rejects a kodejual that already exists", () => {
    createPenjualan(newPenjualan);

    expect(() => createPenjualan(newPenjualan)).toThrow(/sudah digunakan/);
  });
});

describe("getPenjualan", () => {
  it("returns the matching item", () => {
    createPenjualan(newPenjualan);

    expect(getPenjualan(newPenjualan.kodejual)).toEqual(newPenjualan);
  });

  it("throws when the kodejual does not exist", () => {
    expect(() => getPenjualan("PJ-MISSING")).toThrow(/tidak ditemukan/);
  });
});

describe("updatePenjualan", () => {
  it("replaces the item's fields", () => {
    createPenjualan(newPenjualan);

    const updated = updatePenjualan(newPenjualan.kodejual, {
      ...newPenjualan,
      status: "D",
    });

    expect(updated.status).toBe("D");
    expect(findAllPenjualan()).toContainEqual({ ...newPenjualan, status: "D" });
  });

  it("throws when the kodejual does not exist", () => {
    expect(() => updatePenjualan("PJ-MISSING", newPenjualan)).toThrow(/tidak ditemukan/);
  });
});

describe("generateKodePenjualan", () => {
  it("produces a code following the PJ-YYYYMMDD-#### pattern not already used", () => {
    const generated = generateKodePenjualan();

    expect(generated).toMatch(/^PJ-\d{8}-\d{4}$/);
    expect(findAllPenjualan().some((item) => item.kodejual === generated)).toBe(false);
  });
});
