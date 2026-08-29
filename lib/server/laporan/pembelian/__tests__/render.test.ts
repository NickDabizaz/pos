import { describe, expect, it } from "vitest";

import { buatKonteksLaporanPembelian, renderLaporanPembelian } from "@/lib/server/laporan/pembelian/render";
import type { BarisLaporanPembelian } from "@/lib/server/laporan/pembelian/types";

function buatBaris(overrides: Partial<BarisLaporanPembelian> = {}): BarisLaporanPembelian {
  return {
    kodebeli    : "PB2608240001",
    tgltrans    : new Date("2026-08-24T00:00:00.000Z"),
    namalokasi  : "Toko Pusat",
    namasupplier: "PT Sumber Pangan",
    total       : 20000,
    diskon      : 0,
    ppn         : 0,
    grandtotal  : 20000,
    status      : "S",
    namabarang  : "Indomie Goreng",
    satuan      : "PCS",
    qty         : 10,
    harga       : 2000,
    subtotal    : 20000,
    ppnBaris    : 0,
    ...overrides,
  };
}

const konteksKosong = buatKonteksLaporanPembelian("Toko Nick", {}, new Date("2026-08-28T10:30:00.000Z"));

describe("render laporan pembelian", () => {
  it("transaksi 2 baris menghasilkan 2 <tr>, mengulang supplier & grandtotal yang sama", () => {
    const rows = [
      buatBaris({ namabarang: "Barang A" }),
      buatBaris({ namabarang: "Barang B" }),
    ];

    const html = renderLaporanPembelian(rows, konteksKosong);

    expect((html.match(/<tr/g) ?? []).length).toBe(3); // header + 2 baris
    expect((html.match(/PT Sumber Pangan/g) ?? []).length).toBe(2);
    expect((html.match(/20\.000/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("Pembelian D hanya muncul dengan penanda saat termasukDibatalkan", () => {
    const html = renderLaporanPembelian([buatBaris({ status: "D" })], konteksKosong);

    expect(html).toContain("DIBATALKAN");
  });

  it("nol baris -> dokumen sah dengan pesan tidak ada data", () => {
    const html = renderLaporanPembelian([], konteksKosong);

    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });

  it("konteks tanpa tanggal -> Periode: Semua Tanggal", () => {
    const konteks = buatKonteksLaporanPembelian("Toko Nick", {}, new Date());

    expect(konteks.keteranganFilter).toContain("Periode: Semua Tanggal");
  });
});
