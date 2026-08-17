import { describe, expect, it } from "vitest";

import { validatePembelianForm } from "@/app/pembelian/lib/validatePembelianForm";
import type { Pembelian } from "@/app/pembelian/lib/types";

const validValues: Pembelian = {
  kodebeli    : "PB-20260817-0001",
  tanggal     : "2026-08-17",
  kodesupplier: "SUP-0001",
  namasupplier: "PT Sumber Berkah Pangan",
  items       : [
    { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", qty: 1, harga: 55000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 55000 },
  ],
  total     : 55000,
  diskon    : 0,
  ppn       : 0,
  grandtotal: 55000,
  status    : "S",
};

describe("validatePembelianForm", () => {
  it("returns no errors for valid values", () => {
    expect(validatePembelianForm(validValues)).toEqual({});
  });

  it("requires tanggal", () => {
    expect(validatePembelianForm({ ...validValues, tanggal: "" }).tanggal).toBeDefined();
  });

  it("requires kodesupplier", () => {
    expect(validatePembelianForm({ ...validValues, kodesupplier: "" }).kodesupplier).toBeDefined();
  });

  it("requires at least one item", () => {
    expect(validatePembelianForm({ ...validValues, items: [] }).items).toBeDefined();
  });

  it("requires every row to have a barang picked", () => {
    const errors = validatePembelianForm({
      ...validValues,
      items: [{ ...validValues.items[0], kodebarang: "" }],
    });

    expect(errors.items).toBeDefined();
  });
});
