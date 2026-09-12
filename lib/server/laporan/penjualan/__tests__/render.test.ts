import { describe, expect, it } from "vitest";

import { buatKonteksLaporanPenjualan, renderLaporanPenjualan } from "@/lib/server/laporan/penjualan/render";
import type { TransaksiLaporanPenjualan } from "@/lib/server/laporan/penjualan/types";

function buatTransaksi(overrides: Partial<TransaksiLaporanPenjualan> = {}): TransaksiLaporanPenjualan {
  return {
    kodejual    : "JL2608240001",
    tgltrans    : new Date("2026-08-24T00:00:00.000Z"),
    namalokasi  : "Toko Pusat",
    namacustomer: "Toko Maju",
    total       : 30000,
    diskon      : 0,
    ppn         : 0,
    grandtotal  : 30000,
    status      : "S",
    detail      : [
      { namabarang: "Indomie Goreng", satuan: "PCS", qty: 10, harga: 3000, subtotal: 30000, ppnBaris: 0 },
    ],
    ...overrides,
  };
}

const konteks = buatKonteksLaporanPenjualan("Toko Nick", {}, new Date("2026-08-28T10:30:00.000Z"));

describe("render: pengelompokan per transaksi", () => {
  it("satu transaksi 3 detail = 1 baris grup + 3 baris detail", () => {
    const html = renderLaporanPenjualan(
      [
        buatTransaksi({
          detail: [
            { namabarang: "Barang A", satuan: "PCS", qty: 1, harga: 1000, subtotal: 1000, ppnBaris: 0 },
            { namabarang: "Barang B", satuan: "PCS", qty: 2, harga: 1000, subtotal: 2000, ppnBaris: 0 },
            { namabarang: "Barang C", satuan: "PCS", qty: 3, harga: 1000, subtotal: 3000, ppnBaris: 0 },
          ],
        }),
      ],
      konteks,
    );

    expect((html.match(/class="grup/g) ?? []).length).toBe(1);
    expect((html.match(/JL2608240001/g) ?? []).length).toBe(1);
    expect(html).toContain("Barang A (PCS)");
    expect(html).toContain("Barang C (PCS)");
  });

  it("baris TOTAL menjumlahkan grandtotal semua transaksi", () => {
    const html = renderLaporanPenjualan(
      [buatTransaksi({ grandtotal: 30000 }), buatTransaksi({ kodejual: "JL2608240002", grandtotal: 45000 })],
      konteks,
    );

    expect(html).toContain("TOTAL (2 transaksi)");
    expect(html).toContain("75.000");
  });

  it("nol transaksi = dokumen sah dengan pesan tidak ada data", () => {
    const html = renderLaporanPenjualan([], konteks);

    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });

  it("transaksi batal membawa penanda status", () => {
    const html = renderLaporanPenjualan([buatTransaksi({ status: "D" })], konteks);

    expect(html).toContain("DIBATALKAN");
    expect(html).toContain("dibatalkan");
  });
});

describe("render: keterangan filter", () => {
  it("tanpa dari/sampai -> Periode: Semua Tanggal, Lokasi: Semua", () => {
    const k = buatKonteksLaporanPenjualan("Toko Nick", {}, new Date());

    expect(k.keteranganFilter).toContain("Periode: Semua Tanggal");
    expect(k.keteranganFilter).toContain("Lokasi: Semua");
  });

  it("dengan rentang & daftar lokasi -> keterangan lengkap", () => {
    const k = buatKonteksLaporanPenjualan(
      "Toko Nick",
      {
        dari      : new Date("2026-01-01T00:00:00.000Z"),
        sampai    : new Date("2026-01-31T00:00:00.000Z"),
        namaLokasi: ["Toko A", "Toko B"],
      },
      new Date(),
    );

    expect(k.keteranganFilter).toContain("Periode: 01/01/2026 – 31/01/2026");
    expect(k.keteranganFilter).toContain("Lokasi: Toko A, Toko B");
  });
});
