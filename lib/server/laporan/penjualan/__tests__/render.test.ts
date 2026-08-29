import { describe, expect, it } from "vitest";

import { buatKonteksLaporanPenjualan, renderLaporanPenjualan } from "@/lib/server/laporan/penjualan/render";
import type { BarisLaporanPenjualan } from "@/lib/server/laporan/penjualan/types";

function buatBaris(overrides: Partial<BarisLaporanPenjualan> = {}): BarisLaporanPenjualan {
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
    namabarang  : "Indomie Goreng",
    satuan      : "PCS",
    qty         : 10,
    harga       : 3000,
    subtotal    : 30000,
    ppnBaris    : 0,
    ...overrides,
  };
}

const konteksKosong = buatKonteksLaporanPenjualan("Toko Nick", {}, new Date("2026-08-28T10:30:00.000Z"));

describe("render: bentuk baris", () => {
  it("transaksi dengan 3 baris detail menghasilkan 3 baris <tr>, mengulang nilai transaksi yang sama", () => {
    const rows = [
      buatBaris({ namabarang: "Barang A" }),
      buatBaris({ namabarang: "Barang B" }),
      buatBaris({ namabarang: "Barang C" }),
    ];

    const html = renderLaporanPenjualan(rows, konteksKosong);

    expect((html.match(/<tr/g) ?? []).length).toBe(4); // 1 header + 3 baris
    expect((html.match(/JL2608240001/g) ?? []).length).toBe(3);
    expect((html.match(/Toko Maju/g) ?? []).length).toBe(3);
  });

  it("subtotal & ppn per baris diambil dari jualdtl, bukan dibagi rata dari total transaksi", () => {
    const rows = [
      buatBaris({ subtotal: 15000, ppnBaris: 1500 }),
      buatBaris({ subtotal: 45000, ppnBaris: 4500 }),
    ];

    const html = renderLaporanPenjualan(rows, konteksKosong);

    expect(html).toContain("15.000");
    expect(html).toContain("45.000");
    expect(html).toContain("1.500");
    expect(html).toContain("4.500");
  });

  it("dua transaksi berbeda tidak tercampur — kode berbeda terlihat di dokumen", () => {
    const rows = [
      buatBaris({ kodejual: "JL2608240001" }),
      buatBaris({ kodejual: "JL2608240002" }),
    ];

    const html = renderLaporanPenjualan(rows, konteksKosong);

    expect(html).toContain("JL2608240001");
    expect(html).toContain("JL2608240002");
  });

  it("nol baris data menghasilkan dokumen HTML sah dengan pesan tidak ada data, bukan tabel kosong tanpa tbody", () => {
    const html = renderLaporanPenjualan([], konteksKosong);

    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });
});

describe("render: periode & batal", () => {
  it("konteks tanpa dari/sampai menghasilkan teks Periode: Semua Tanggal", () => {
    const konteks = buatKonteksLaporanPenjualan("Toko Nick", {}, new Date());

    expect(konteks.keteranganFilter).toContain("Periode: Semua Tanggal");
  });

  it("konteks dengan dari & sampai menghasilkan Periode: 01/01/2026 – 31/01/2026", () => {
    const konteks = buatKonteksLaporanPenjualan(
      "Toko Nick",
      { dari: new Date("2026-01-01T00:00:00.000Z"), sampai: new Date("2026-01-31T00:00:00.000Z") },
      new Date(),
    );

    expect(konteks.keteranganFilter).toContain("Periode: 01/01/2026 – 31/01/2026");
  });

  it("baris transaksi batal hanya muncul saat termasukDibatalkan true, membawa penanda status yang terbaca", () => {
    const rows = [buatBaris({ status: "D" })];

    const html = renderLaporanPenjualan(rows, konteksKosong);

    expect(html).toContain("DIBATALKAN");
    expect(html).toContain("dibatalkan");
  });
});
