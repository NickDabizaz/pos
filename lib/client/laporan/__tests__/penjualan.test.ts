import { describe, expect, it } from "vitest";

import { buatUrlLaporanPenjualan } from "@/lib/client/laporan/penjualan";

const dasar = { dari: "", sampai: "", termasukDibatalkan: false, idlokasi: [] as number[], totalLokasi: 0 };

describe("buatUrlLaporanPenjualan", () => {
  it("tanpa filter menghasilkan URL tanpa query string", () => {
    expect(buatUrlLaporanPenjualan(dasar)).toBe("/laporan/penjualan/view");
  });

  it("dengan dari & sampai menghasilkan query string keduanya", () => {
    const url = buatUrlLaporanPenjualan({ ...dasar, dari: "2026-01-01", sampai: "2026-01-31" });
    expect(url).toBe("/laporan/penjualan/view?dari=2026-01-01&sampai=2026-01-31");
  });

  it("termasukDibatalkan true menambahkan termasukDibatalkan=1", () => {
    expect(buatUrlLaporanPenjualan({ ...dasar, termasukDibatalkan: true })).toBe(
      "/laporan/penjualan/view?termasukDibatalkan=1",
    );
  });

  it("sebagian Lokasi terpilih -> idlokasi daftar koma; semua terpilih -> tanpa idlokasi", () => {
    expect(buatUrlLaporanPenjualan({ ...dasar, idlokasi: [2, 3], totalLokasi: 4 })).toBe(
      "/laporan/penjualan/view?idlokasi=2%2C3",
    );
    expect(buatUrlLaporanPenjualan({ ...dasar, idlokasi: [1, 2, 3, 4], totalLokasi: 4 })).toBe(
      "/laporan/penjualan/view",
    );
  });
});
