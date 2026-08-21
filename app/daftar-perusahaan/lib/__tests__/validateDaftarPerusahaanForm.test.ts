import { describe, expect, it } from "vitest";

import { validateDaftarPerusahaanForm } from "@/app/daftar-perusahaan/lib/validateDaftarPerusahaanForm";

describe("validateDaftarPerusahaanForm", () => {
  it("returns no errors for a fully filled-in form with generate off", () => {
    expect(
      validateDaftarPerusahaanForm({ namaperusahaan: "Toko Makmur", generateKode: false, kodeperusahaan: "P001" }),
    ).toEqual({});
  });

  it("Nama Perusahaan kosong ditolak dengan pesan wajib diisi", () => {
    const errors = validateDaftarPerusahaanForm({ namaperusahaan: "", generateKode: true, kodeperusahaan: "" });
    expect(errors.namaperusahaan).toBe("Nama Perusahaan wajib diisi");
  });

  it("centang generate aktif membuat Kode Perusahaan kosong tetap lolos validasi", () => {
    const errors = validateDaftarPerusahaanForm({
      namaperusahaan: "Toko Makmur",
      generateKode  : true,
      kodeperusahaan: "",
    });
    expect(errors.kodeperusahaan).toBeUndefined();
  });

  it("centang generate mati dengan Kode Perusahaan kosong ditolak dengan pesan wajib diisi", () => {
    const errors = validateDaftarPerusahaanForm({
      namaperusahaan: "Toko Makmur",
      generateKode  : false,
      kodeperusahaan: "",
    });
    expect(errors.kodeperusahaan).toBe("Kode Perusahaan wajib diisi");
  });
});
