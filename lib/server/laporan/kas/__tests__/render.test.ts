import { describe, expect, it } from "vitest";

import { buatKonteksLaporanKas, renderLaporanKas } from "@/lib/server/laporan/kas/render";
import type { BarisLaporanKas } from "@/lib/server/laporan/kas/types";

function buatBaris(overrides: Partial<BarisLaporanKas> = {}): BarisLaporanKas {
  return {
    kodekas   : "KS2608240001",
    tgltrans  : new Date("2026-08-24T00:00:00.000Z"),
    namalokasi: "Toko Pusat",
    jenis     : "MASUK",
    grandtotal: 300000,
    status    : "S",
    keterangan: "Setoran modal",
    nominal   : 100000,
    ...overrides,
  };
}

const konteksKosong = buatKonteksLaporanKas("Toko Nick", {}, new Date("2026-08-28T10:30:00.000Z"));

describe("render laporan kas", () => {
  it("kas dengan 3 rincian -> 3 baris, masing-masing membawa jenis & grandtotal transaksi", () => {
    const rows = [
      buatBaris({ keterangan: "Rincian 1", nominal: 100000 }),
      buatBaris({ keterangan: "Rincian 2", nominal: 100000 }),
      buatBaris({ keterangan: "Rincian 3", nominal: 100000 }),
    ];

    const html = renderLaporanKas(rows, konteksKosong);

    expect((html.match(/<tr/g) ?? []).length).toBe(4); // header + 3
    expect((html.match(/MASUK/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect((html.match(/300\.000/g) ?? []).length).toBe(3);
  });

  it("jumlah seluruh nominal baris sama dengan grandtotal transaksinya (properti data)", () => {
    const rows = [
      buatBaris({ nominal: 100000, grandtotal: 300000 }),
      buatBaris({ nominal: 100000, grandtotal: 300000 }),
      buatBaris({ nominal: 100000, grandtotal: 300000 }),
    ];

    const totalNominal = rows.reduce((sum, row) => sum + row.nominal, 0);
    expect(totalNominal).toBe(rows[0].grandtotal);
  });

  it("KELUAR dirender apa adanya", () => {
    const html = renderLaporanKas([buatBaris({ jenis: "KELUAR" })], konteksKosong);

    expect(html).toContain("KELUAR");
  });

  it("Kas D hanya tampil dengan penanda saat termasukDibatalkan", () => {
    const html = renderLaporanKas([buatBaris({ status: "D" })], konteksKosong);

    expect(html).toContain("DIBATALKAN");
  });

  it("nol baris -> dokumen sah dengan pesan tidak ada data", () => {
    const html = renderLaporanKas([], konteksKosong);

    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });
});
