import { describe, expect, it } from "vitest";

import { buatUrlLaporanPenjualan } from "@/lib/client/laporan/penjualan";

describe("buatUrlLaporanPenjualan", () => {
  it("tanpa filter menghasilkan URL tanpa query string", () => {
    expect(buatUrlLaporanPenjualan({ dari: "", sampai: "", termasukDibatalkan: false })).toBe("/laporan/penjualan/view");
  });

  it("dengan dari & sampai menghasilkan query string keduanya", () => {
    const url = buatUrlLaporanPenjualan({ dari: "2026-01-01", sampai: "2026-01-31", termasukDibatalkan: false });
    expect(url).toBe("/laporan/penjualan/view?dari=2026-01-01&sampai=2026-01-31");
  });

  it("termasukDibatalkan true menambahkan termasukDibatalkan=1", () => {
    const url = buatUrlLaporanPenjualan({ dari: "", sampai: "", termasukDibatalkan: true });
    expect(url).toBe("/laporan/penjualan/view?termasukDibatalkan=1");
  });
});
