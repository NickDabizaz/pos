import { describe, expect, it } from "vitest";

import { buatKonteksLaporanPosisiStok, renderLaporanPosisiStok } from "@/lib/server/laporan/posisistok/render";
import type { BarisLaporanPosisiStok } from "@/lib/server/laporan/posisistok/types";

function buatBaris(overrides: Partial<BarisLaporanPosisiStok> = {}): BarisLaporanPosisiStok {
  return {
    idbarang  : 1,
    namabarang: "Indomie Goreng",
    satuan    : "PCS",
    namalokasi: "Toko Pusat",
    saldo     : 7,
    ...overrides,
  };
}

describe("render laporan posisi stok", () => {
  it("nol baris -> dokumen sah dengan pesan tidak ada data", () => {
    const konteks = buatKonteksLaporanPosisiStok("Toko Nick", { namabarang: null, tanggal: new Date("2026-08-28") }, new Date());
    const html = renderLaporanPosisiStok([], konteks);

    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });

  it("konteks Barang: mengikuti filter, dan menyebut tanggal hari ini", () => {
    const konteks = buatKonteksLaporanPosisiStok("Toko Nick", { namabarang: "Indomie Goreng", tanggal: new Date("2026-08-28") }, new Date());

    expect(konteks.keteranganFilter).toContain("Barang: Indomie Goreng");
    expect(konteks.keteranganFilter.some((baris) => baris.includes("28/08/2026"))).toBe(true);
  });

  it("angka pecahan 1500.25 tampil utuh, bukan dibulatkan", () => {
    const konteks = buatKonteksLaporanPosisiStok("Toko Nick", { namabarang: null, tanggal: new Date() }, new Date());
    const html = renderLaporanPosisiStok([buatBaris({ saldo: 1500.25 })], konteks);

    expect(html).toContain("1.500,25");
  });
});
