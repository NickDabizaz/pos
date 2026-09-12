import { describe, expect, it } from "vitest";

import { buatKonteksLaporanKas, renderLaporanKas } from "@/lib/server/laporan/kas/render";
import type { TransaksiLaporanKas } from "@/lib/server/laporan/kas/types";

function buatTransaksi(overrides: Partial<TransaksiLaporanKas> = {}): TransaksiLaporanKas {
  return {
    kodekas   : "KS2608240001",
    tgltrans  : new Date("2026-08-24T00:00:00.000Z"),
    namalokasi: "Toko Pusat",
    jenis     : "MASUK",
    grandtotal: 300000,
    status    : "S",
    detail    : [
      { keterangan: "Rincian 1", nominal: 100000 },
      { keterangan: "Rincian 2", nominal: 100000 },
      { keterangan: "Rincian 3", nominal: 100000 },
    ],
    ...overrides,
  };
}

const konteks = buatKonteksLaporanKas("Toko Nick", {}, new Date("2026-08-28T10:30:00.000Z"));

describe("render laporan kas", () => {
  it("satu kas 3 rincian = 1 baris grup + 3 baris detail", () => {
    const html = renderLaporanKas([buatTransaksi()], konteks);

    expect((html.match(/class="grup/g) ?? []).length).toBe(1);
    expect(html).toContain("Rincian 1");
    expect(html).toContain("Rincian 3");
  });

  it("baris TOTAL memisahkan Masuk & Keluar", () => {
    const html = renderLaporanKas(
      [buatTransaksi({ jenis: "MASUK", grandtotal: 300000 }), buatTransaksi({ kodekas: "KS2", jenis: "KELUAR", grandtotal: 50000 })],
      konteks,
    );

    expect(html).toContain("TOTAL (2 transaksi)");
    expect(html).toMatch(/Masuk Rp\s*300\.000/);
    expect(html).toMatch(/Keluar Rp\s*50\.000/);
  });

  it("Kas D membawa penanda", () => {
    expect(renderLaporanKas([buatTransaksi({ status: "D" })], konteks)).toContain("DIBATALKAN");
  });

  it("nol transaksi -> pesan tidak ada data", () => {
    const html = renderLaporanKas([], konteks);
    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });
});
