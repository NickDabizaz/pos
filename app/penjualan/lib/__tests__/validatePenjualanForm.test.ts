import { describe, expect, it } from "vitest";

import { validatePenjualanForm } from "@/app/penjualan/lib/validatePenjualanForm";
import type { Penjualan } from "@/app/penjualan/lib/types";

const validValues: Penjualan = {
  kodejual      : "PJ-20260817-0001",
  tanggal       : "2026-08-17",
  jenistransaksi: "PESANAN",
  kodecustomer  : "CUST-0001",
  namacustomer  : "Budi Santoso",
  items         : [
    { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", qty: 1, harga: 65000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 65000 },
  ],
  total     : 65000,
  diskon    : 0,
  ppn       : 0,
  grandtotal: 65000,
  status    : "S",
};

describe("validatePenjualanForm", () => {
  it("returns no errors for valid values", () => {
    expect(validatePenjualanForm(validValues)).toEqual({});
  });

  it("requires tanggal", () => {
    expect(validatePenjualanForm({ ...validValues, tanggal: "" }).tanggal).toBeDefined();
  });

  it("requires kodecustomer", () => {
    expect(validatePenjualanForm({ ...validValues, kodecustomer: "" }).kodecustomer).toBeDefined();
  });

  it("requires at least one item", () => {
    expect(validatePenjualanForm({ ...validValues, items: [] }).items).toBeDefined();
  });

  it("requires every row to have a barang picked", () => {
    const errors = validatePenjualanForm({
      ...validValues,
      items: [{ ...validValues.items[0], kodebarang: "" }],
    });

    expect(errors.items).toBeDefined();
  });
});
