import { describe, expect, it } from "vitest";

import { buatKonteksLaporanKartuStok, renderLaporanKartuStok } from "@/lib/server/laporan/kartustok/render";
import type { GrupLaporanKartuStok } from "@/lib/server/laporan/kartustok/types";

function buatGrup(overrides: Partial<GrupLaporanKartuStok> = {}): GrupLaporanKartuStok {
  return {
    idbarang  : 1,
    namabarang: "Indomie Goreng",
    satuan    : "PCS",
    saldoAwal : 0,
    saldoAkhir: 10,
    baris: [
      {
        tgltrans      : new Date("2026-08-24T00:00:00.000Z"),
        kodetrans     : "PB2608240001",
        jenistransaksi: "PEMBELIAN",
        namalokasi    : "Toko Pusat",
        masuk         : 10,
        keluar        : null,
        saldoBerjalan : 10,
        catatan       : "pembelian",
      },
    ],
    ...overrides,
  };
}

describe("render laporan kartu stok", () => {
  it("nol grup -> dokumen sah dengan pesan tidak ada data", () => {
    const konteks = buatKonteksLaporanKartuStok("Toko Nick", {}, new Date());
    const html = renderLaporanKartuStok([], konteks);

    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });

  it("keterangan filter memuat Barang, Periode, dan Lokasi", () => {
    const konteks = buatKonteksLaporanKartuStok(
      "Toko Nick",
      { namabarang: "Indomie Goreng", dari: new Date("2026-08-01"), sampai: new Date("2026-08-31"), namaLokasi: ["Toko A"] },
      new Date(),
    );

    expect(konteks.keteranganFilter).toContain("Barang: Indomie Goreng");
    expect(konteks.keteranganFilter).toContain("Periode: 01/08/2026 – 31/08/2026");
    expect(konteks.keteranganFilter).toContain("Lokasi: Toko A");
  });

  it("tiap Barang punya baris Saldo Awal dan Saldo Akhir", () => {
    const konteks = buatKonteksLaporanKartuStok("Toko Nick", {}, new Date());
    const html = renderLaporanKartuStok([buatGrup({ saldoAwal: 5, saldoAkhir: 15 })], konteks);

    expect(html).toContain("Saldo Awal");
    expect(html).toContain("Saldo Akhir");
  });

  it("Barang tanpa mutasi periode tapi Saldo Awal != 0 tetap dirender (hanya Saldo Awal & Akhir)", () => {
    const konteks = buatKonteksLaporanKartuStok("Toko Nick", {}, new Date());
    const html = renderLaporanKartuStok([buatGrup({ saldoAwal: 7, saldoAkhir: 7, baris: [] })], konteks);

    expect(html).toContain("Indomie Goreng");
    expect(html).toContain("Saldo Awal");
  });

  it("angka pecahan 1500.25 tampil utuh", () => {
    const konteks = buatKonteksLaporanKartuStok("Toko Nick", {}, new Date());
    const html = renderLaporanKartuStok(
      [
        buatGrup({
          saldoAkhir: 1500.25,
          baris: [
            { tgltrans: new Date("2026-08-24"), kodetrans: "PB01", jenistransaksi: "PEMBELIAN", namalokasi: "A", masuk: 1500.25, keluar: null, saldoBerjalan: 1500.25, catatan: "" },
          ],
        }),
      ],
      konteks,
    );

    expect(html).toContain("1.500,25");
  });
});
