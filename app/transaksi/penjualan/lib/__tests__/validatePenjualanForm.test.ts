import { describe, expect, it } from "vitest";

import type { PenjualanFormValues } from "@/app/transaksi/penjualan/lib/types";
import { validatePenjualanForm } from "@/app/transaksi/penjualan/lib/validatePenjualanForm";

const validValues: PenjualanFormValues = {
  tanggal     : "2026-08-17",
  kodecustomer: "CUST-0001",
  namacustomer: "Budi Santoso",
  kodelokasi  : "LOK-0001",
  namalokasi  : "Toko Utama",
  items       : [
    { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", qty: 1, harga: 65000, pakaiPpn: "TIDAK", diskon: 0, ppn: 0, subtotal: 65000 },
  ],
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

  it("requires kodelokasi", () => {
    expect(validatePenjualanForm({ ...validValues, kodelokasi: "" }).kodelokasi).toBeDefined();
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
