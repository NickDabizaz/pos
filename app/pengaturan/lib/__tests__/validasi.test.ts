import { describe, expect, it } from "vitest";

import { validasiNilai } from "@/app/pengaturan/lib/validasi";

describe("Validasi nilai Config di sisi halaman pengaturan", () => {
  it("awalan kosong ditolak dengan pesan yang menyebut modul dan kuncinya", () => {
    expect(validasiNilai("barang", "awalan", "")).toMatch(/modul "barang".*kunci "awalan"/i);
  });

  it.each(["abc", "0", "-1", "3.5"])("panjangnomor bernilai %s ditolak", (nilai) => {
    expect(validasiNilai("barang", "panjangnomor", nilai)).toMatch(/kunci "panjangnomor"/);
  });

  it.each(["101", "-1", "sepuluh"])("persentase bernilai %s ditolak", (nilai) => {
    expect(validasiNilai("ppn", "persentase", nilai)).toMatch(/kunci "persentase"/);
  });

  it("tema bernilai biru ditolak karena hanya terang atau gelap yang sah", () => {
    expect(validasiNilai("tampilan", "tema", "biru")).toMatch(/kunci "tema"/);
  });

  it("status ppn bernilai aktif ditolak karena hanya 0 atau 1 yang sah", () => {
    expect(validasiNilai("ppn", "status", "aktif")).toMatch(/kunci "status"/);
  });

  it("awalan dengan angka dan tanda hubung diterima", () => {
    expect(validasiNilai("customer", "awalan", "BRG-01")).toBeNull();
  });

  it("persentase desimal pada batas atas diterima", () => {
    expect(validasiNilai("ppn", "persentase", "10.5")).toBeNull();
    expect(validasiNilai("ppn", "persentase", "100")).toBeNull();
    expect(validasiNilai("ppn", "persentase", "0")).toBeNull();
  });
});
