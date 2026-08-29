import { describe, expect, it } from "vitest";

import { buatKonteksLaporanKartuStok, renderLaporanKartuStok } from "@/lib/server/laporan/kartustok/render";
import type { GrupLaporanKartuStok } from "@/lib/server/laporan/kartustok/types";

function buatGrup(overrides: Partial<GrupLaporanKartuStok> = {}): GrupLaporanKartuStok {
  return {
    idbarang  : 1,
    namabarang: "Indomie Goreng",
    satuan    : "PCS",
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

  it("konteks tanpa filter -> Barang: Semua; dengan filter -> nama Barang", () => {
    const kosong = buatKonteksLaporanKartuStok("Toko Nick", { namabarang: null }, new Date());
    expect(kosong.keteranganFilter).toContain("Barang: Semua");

    const terisi = buatKonteksLaporanKartuStok("Toko Nick", { namabarang: "Indomie Goreng" }, new Date());
    expect(terisi.keteranganFilter).toContain("Barang: Indomie Goreng");
  });

  it("Barang tanpa pergerakan menampilkan penanda 'Tidak ada pergerakan'", () => {
    const konteks = buatKonteksLaporanKartuStok("Toko Nick", {}, new Date());
    const html = renderLaporanKartuStok([buatGrup({ baris: [] })], konteks);

    expect(html).toContain("Tidak ada pergerakan");
  });

  it("mk M mengisi kolom masuk, K mengisi kolom keluar — dirender apa adanya dari data", () => {
    const konteks = buatKonteksLaporanKartuStok("Toko Nick", {}, new Date());
    const grup = buatGrup({
      baris: [
        { tgltrans: new Date("2026-08-24"), kodetrans: "PB01", jenistransaksi: "PEMBELIAN", namalokasi: "A", masuk: 10, keluar: null, saldoBerjalan: 10, catatan: "" },
        { tgltrans: new Date("2026-08-25"), kodetrans: "JL01", jenistransaksi: "PENJUALAN", namalokasi: "A", masuk: null, keluar: 3, saldoBerjalan: 7, catatan: "" },
      ],
    });

    const html = renderLaporanKartuStok([grup], konteks);
    expect(html).toContain(">10<");
    expect(html).toContain(">7<");
  });

  it("angka pecahan 1500.25 tampil utuh, bukan dibulatkan", () => {
    const konteks = buatKonteksLaporanKartuStok("Toko Nick", {}, new Date());
    const grup = buatGrup({
      baris: [
        { tgltrans: new Date("2026-08-24"), kodetrans: "PB01", jenistransaksi: "PEMBELIAN", namalokasi: "A", masuk: 1500.25, keluar: null, saldoBerjalan: 1500.25, catatan: "" },
      ],
    });

    const html = renderLaporanKartuStok([grup], konteks);
    expect(html).toContain("1.500,25");
  });
});
