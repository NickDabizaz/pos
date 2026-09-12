import { describe, expect, it } from "vitest";

import { buatKonteksLaporanPembelian, renderLaporanPembelian } from "@/lib/server/laporan/pembelian/render";
import type { TransaksiLaporanPembelian } from "@/lib/server/laporan/pembelian/types";

function buatTransaksi(overrides: Partial<TransaksiLaporanPembelian> = {}): TransaksiLaporanPembelian {
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
    detail      : [
      { namabarang: "Indomie Goreng", satuan: "PCS", qty: 10, harga: 2000, subtotal: 20000, ppnBaris: 0 },
    ],
    ...overrides,
  };
}

const konteks = buatKonteksLaporanPembelian("Toko Nick", {}, new Date("2026-08-28T10:30:00.000Z"));

describe("render laporan pembelian", () => {
  it("satu transaksi 2 detail = 1 baris grup + 2 baris detail", () => {
    const html = renderLaporanPembelian(
      [
        buatTransaksi({
          detail: [
            { namabarang: "Barang A", satuan: "PCS", qty: 5, harga: 2000, subtotal: 10000, ppnBaris: 0 },
            { namabarang: "Barang B", satuan: "PCS", qty: 5, harga: 2000, subtotal: 10000, ppnBaris: 0 },
          ],
        }),
      ],
      konteks,
    );

    expect((html.match(/class="grup/g) ?? []).length).toBe(1);
    expect(html).toContain("Barang A (PCS)");
    expect(html).toContain("Barang B (PCS)");
  });

  it("baris TOTAL menjumlahkan grandtotal", () => {
    const html = renderLaporanPembelian(
      [buatTransaksi({ grandtotal: 20000 }), buatTransaksi({ kodebeli: "PB2608240002", grandtotal: 30000 })],
      konteks,
    );

    expect(html).toContain("TOTAL (2 transaksi)");
    expect(html).toContain("50.000");
  });

  it("Pembelian D membawa penanda", () => {
    expect(renderLaporanPembelian([buatTransaksi({ status: "D" })], konteks)).toContain("DIBATALKAN");
  });

  it("nol transaksi -> pesan tidak ada data", () => {
    const html = renderLaporanPembelian([], konteks);
    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });

  it("keterangan filter memuat Periode & Lokasi", () => {
    const k = buatKonteksLaporanPembelian("Toko Nick", { namaLokasi: ["Gudang"] }, new Date());
    expect(k.keteranganFilter).toContain("Periode: Semua Tanggal");
    expect(k.keteranganFilter).toContain("Lokasi: Gudang");
  });
});
