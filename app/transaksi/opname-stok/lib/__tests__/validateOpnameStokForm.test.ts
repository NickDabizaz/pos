import { describe, expect, it } from "vitest";

import { validateOpnameStokForm } from "@/app/transaksi/opname-stok/lib/validateOpnameStokForm";
import type { OpnameStokFormValues } from "@/app/transaksi/opname-stok/lib/types";

function buatNilai(overrides: Partial<OpnameStokFormValues> = {}): OpnameStokFormValues {
  return {
    tanggal   : "2026-01-15",
    kodelokasi: "TOKO",
    namalokasi: "Toko Utama",
    rows      : [{ kodebarang: "B0001", namabarang: "Beras", satuan: "KARUNG", jmlsistem: 10, jmlfisik: 10 }],
    ...overrides,
  };
}

describe("validateOpnameStokForm", () => {
  it("nilai lengkap dan sah tidak menghasilkan error", () => {
    expect(validateOpnameStokForm(buatNilai())).toEqual({});
  });

  it("tanggal kosong ditolak", () => {
    expect(validateOpnameStokForm(buatNilai({ tanggal: "" })).tanggal).toBeDefined();
  });

  it("tanggal setelah hari ini ditolak", () => {
    expect(validateOpnameStokForm(buatNilai({ tanggal: "2999-12-31" })).tanggal).toBeDefined();
  });

  it("lokasi kosong ditolak", () => {
    expect(validateOpnameStokForm(buatNilai({ kodelokasi: "" })).kodelokasi).toBeDefined();
  });

  it("tanpa satu pun baris ditolak", () => {
    expect(validateOpnameStokForm(buatNilai({ rows: [] })).rows).toBeDefined();
  });

  it("jumlah fisik negatif ditolak", () => {
    const nilai = buatNilai({
      rows: [{ kodebarang: "B0001", namabarang: "Beras", satuan: "KARUNG", jmlsistem: 10, jmlfisik: -1 }],
    });

    expect(validateOpnameStokForm(nilai).rows).toBeDefined();
  });
});
