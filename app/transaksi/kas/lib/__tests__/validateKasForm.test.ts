import { describe, expect, it } from "vitest";

import type { KasFormValues } from "@/app/transaksi/kas/lib/types";
import { validateKasForm } from "@/app/transaksi/kas/lib/validateKasForm";

const validValues: KasFormValues = {
  tanggal   : "2026-08-24",
  jenis     : "MASUK",
  kodelokasi: "LOK-0001",
  namalokasi: "Toko Utama",
  rincian   : [{ keterangan: "Setoran modal", nominal: 100000 }],
};

describe("validateKasForm", () => {
  it("returns no errors for valid values", () => {
    expect(validateKasForm(validValues)).toEqual({});
  });

  it("requires tanggal", () => {
    expect(validateKasForm({ ...validValues, tanggal: "" }).tanggal).toBeDefined();
  });

  it("requires kodelokasi", () => {
    expect(validateKasForm({ ...validValues, kodelokasi: "" }).kodelokasi).toBeDefined();
  });

  it("requires at least one rincian row", () => {
    expect(validateKasForm({ ...validValues, rincian: [] }).rincian).toBeDefined();
  });

  it("requires every rincian row to have keterangan and positive nominal", () => {
    expect(validateKasForm({ ...validValues, rincian: [{ keterangan: "", nominal: 100000 }] }).rincian).toBeDefined();
    expect(validateKasForm({ ...validValues, rincian: [{ keterangan: "Isi", nominal: 0 }] }).rincian).toBeDefined();
  });
});
