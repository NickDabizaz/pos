import { describe, expect, it } from "vitest";

import { validateBarangForm } from "@/app/master/barang/lib/validateBarangForm";
import type { Barang } from "@/app/master/barang/lib/types";

const validValues: Barang = {
  idbarang  : 1,
  kodebarang: "BRG-0001",
  namabarang: "Beras 5kg",
  barcode   : "8991002100017",
  satuan    : "Karung",
  hargabeli : 55000,
  hargajual : 65000,
  pakaistok : true,
  status    : 1,
};

describe("validateBarangForm", () => {
  it("returns no errors for fully valid values", () => {
    expect(validateBarangForm(validValues)).toEqual({});
  });

  it("does not validate kodebarang, since it is always server-generated", () => {
    const errors = validateBarangForm({ ...validValues, kodebarang: "" });
    expect(errors.kodebarang).toBeUndefined();
  });

  it("flags required text fields left blank", () => {
    const errors = validateBarangForm({
      ...validValues,
      namabarang: "",
      satuan    : "",
    });

    expect(errors).toEqual({
      namabarang: "Nama barang wajib diisi",
      satuan    : "Satuan wajib diisi",
    });
  });

  it("flags negative numeric fields", () => {
    const errors = validateBarangForm({
      ...validValues,
      hargabeli: -1,
      hargajual: -1,
    });

    expect(errors).toEqual({
      hargabeli: "Harga beli tidak boleh negatif",
      hargajual: "Harga jual tidak boleh negatif",
    });
  });

  it("flags numeric fields left empty as required, distinct from an explicit zero", () => {
    const errors = validateBarangForm({
      ...validValues,
      hargabeli: NaN,
      hargajual: NaN,
    });

    expect(errors).toEqual({
      hargabeli: "Harga beli wajib diisi",
      hargajual: "Harga jual wajib diisi",
    });
  });

  it("accepts an explicit zero for numeric fields", () => {
    const errors = validateBarangForm({
      ...validValues,
      hargabeli: 0,
      hargajual: 0,
    });

    expect(errors).toEqual({});
  });
});
