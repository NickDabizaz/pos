import { describe, expect, it } from "vitest";

import { buatKonteksLaporanJurnal, renderLaporanJurnal } from "@/lib/server/laporan/jurnal/render";
import type { BarisLaporanJurnal } from "@/lib/server/laporan/jurnal/types";

function buatBaris(overrides: Partial<BarisLaporanJurnal> = {}): BarisLaporanJurnal {
  return {
    kodetrans     : "JL2608240001",
    tgltrans      : new Date("2026-08-24T00:00:00.000Z"),
    jenistransaksi: "PENJUALAN",
    namalokasi    : "Toko Pusat",
    urutan        : 1,
    saldo         : "DEBET",
    amount        : 100000,
    catatan       : "Kas",
    ...overrides,
  };
}

const konteks = buatKonteksLaporanJurnal("Toko Nick", {}, new Date());

describe("render laporan jurnal", () => {
  it("satu blok per kodetrans; amount masuk kolom Debet atau Kredit sesuai flag", () => {
    const html = renderLaporanJurnal(
      [buatBaris({ saldo: "DEBET", catatan: "Kas", amount: 100000 }), buatBaris({ saldo: "KREDIT", urutan: 2, catatan: "Penjualan", amount: 100000 })],
      konteks,
    );

    expect((html.match(/<h3>/g) ?? []).length).toBe(1);
    expect(html).toContain("<th class=\"angka\">Debet</th>");
    expect(html).toContain("Total");
    expect(html).not.toContain("TIDAK BALANCE");
  });

  it("blok tidak seimbang mendapat badge TIDAK BALANCE", () => {
    const html = renderLaporanJurnal(
      [buatBaris({ saldo: "DEBET", amount: 100000 }), buatBaris({ saldo: "KREDIT", urutan: 2, amount: 90000 })],
      konteks,
    );

    expect(html).toContain("TIDAK BALANCE");
  });

  it("dua kodetrans berbeda -> dua blok + GRAND TOTAL", () => {
    const html = renderLaporanJurnal(
      [
        buatBaris({ kodetrans: "JL01", saldo: "DEBET", amount: 100000 }),
        buatBaris({ kodetrans: "JL01", saldo: "KREDIT", urutan: 2, amount: 100000 }),
        buatBaris({ kodetrans: "JL02", saldo: "DEBET", amount: 50000 }),
        buatBaris({ kodetrans: "JL02", saldo: "KREDIT", urutan: 2, amount: 50000 }),
      ],
      konteks,
    );

    expect((html.match(/<h3>/g) ?? []).length).toBe(2);
    expect(html).toContain("GRAND TOTAL");
  });

  it("nol baris -> pesan tidak ada data", () => {
    const html = renderLaporanJurnal([], konteks);
    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });

  it("keterangan filter memuat Kode, Periode, Lokasi", () => {
    const k = buatKonteksLaporanJurnal("Toko Nick", { kodetrans: "JL2608", namaLokasi: ["Toko A"] }, new Date());
    expect(k.keteranganFilter).toContain("Kode: JL2608");
    expect(k.keteranganFilter).toContain("Periode: Semua Tanggal");
    expect(k.keteranganFilter).toContain("Lokasi: Toko A");
  });

  it("amount besar dirender tanpa notasi ilmiah", () => {
    const html = renderLaporanJurnal([buatBaris({ amount: 999999999999.99 })], konteks);
    expect(html).not.toContain("e+");
  });
});
