import { describe, expect, it } from "vitest";

import { validasiNilai } from "@/app/pengaturan/lib/validasi";

describe("Validasi nilai Config di sisi halaman pengaturan", () => {
  it("awalan kosong ditolak dengan pesan yang menyebut modul dan kuncinya", () => {
    expect(validasiNilai("BARANG", "AWALAN", "")).toMatch(/modul "BARANG".*kunci "AWALAN"/i);
  });

  it.each(["abc", "0", "-1", "3.5"])("panjangnomor bernilai %s ditolak", (nilai) => {
    expect(validasiNilai("BARANG", "PANJANGNOMOR", nilai)).toMatch(/kunci "PANJANGNOMOR"/);
  });

  it.each(["101", "-1", "sepuluh"])("persentase bernilai %s ditolak", (nilai) => {
    expect(validasiNilai("PPN", "PERSENTASE", nilai)).toMatch(/kunci "PERSENTASE"/);
  });

  it("tema bernilai biru ditolak karena hanya LIGHT atau DARK yang sah", () => {
    expect(validasiNilai("TAMPILAN", "TEMA", "biru")).toMatch(/kunci "TEMA"/);
  });

  it("status ppn bernilai aktif ditolak karena hanya 0 atau 1 yang sah", () => {
    expect(validasiNilai("PPN", "STATUS", "aktif")).toMatch(/kunci "STATUS"/);
  });

  it("nilai dinormalkan ke uppercase sehingga input huruf kecil tetap dikenali", () => {
    expect(validasiNilai("barang", "awalan", "BRG-01")).toBeNull();
    expect(validasiNilai("tampilan", "tema", "dark")).toBeNull();
  });

  it("persentase desimal pada batas atas diterima", () => {
    expect(validasiNilai("PPN", "PERSENTASE", "10.5")).toBeNull();
    expect(validasiNilai("PPN", "PERSENTASE", "100")).toBeNull();
    expect(validasiNilai("PPN", "PERSENTASE", "0")).toBeNull();
  });
});
