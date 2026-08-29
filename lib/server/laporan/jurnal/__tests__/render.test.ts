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
    catatan       : "penjualan tunai",
    ...overrides,
  };
}

describe("render: bentuk & header", () => {
  it("saldo DEBET/KREDIT dirender apa adanya di kolomnya sendiri", () => {
    const konteks = buatKonteksLaporanJurnal("Toko Nick", {}, new Date());
    const html = renderLaporanJurnal([buatBaris({ saldo: "DEBET" }), buatBaris({ saldo: "KREDIT", urutan: 2 })], konteks);

    expect(html).toContain("DEBET");
    expect(html).toContain("KREDIT");
  });

  it("nol baris -> dokumen HTML sah dengan pesan tidak ada data", () => {
    const konteks = buatKonteksLaporanJurnal("Toko Nick", {}, new Date());
    const html = renderLaporanJurnal([], konteks);

    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });

  it("konteks tanpa kode -> Kode: Semua; tanpa tanggal -> Periode: Semua Tanggal", () => {
    const konteks = buatKonteksLaporanJurnal("Toko Nick", {}, new Date());

    expect(konteks.keteranganFilter).toContain("Kode: Semua");
    expect(konteks.keteranganFilter).toContain("Periode: Semua Tanggal");
  });

  it("konteks dengan kode menghasilkan Kode: <str>", () => {
    const konteks = buatKonteksLaporanJurnal("Toko Nick", { kodetrans: "JL2608" }, new Date());

    expect(konteks.keteranganFilter).toContain("Kode: JL2608");
  });

  it("amount 999999999999.99 dirender utuh dengan pemisah ribuan, tanpa overflow/notasi ilmiah", () => {
    const konteks = buatKonteksLaporanJurnal("Toko Nick", {}, new Date());
    const html = renderLaporanJurnal([buatBaris({ amount: 999999999999.99 })], konteks);

    expect(html).toContain("1.000.000.000.000"); // dibulatkan (formatUang tanpa desimal), bukan e+12
    expect(html).not.toContain("e+");
  });

  it("baris satu transaksi (DEBET + KREDIT) tampil berurutan menurut urutan", () => {
    const konteks = buatKonteksLaporanJurnal("Toko Nick", {}, new Date());
    const rows = [buatBaris({ saldo: "DEBET", urutan: 1 }), buatBaris({ saldo: "KREDIT", urutan: 2 })];
    const html = renderLaporanJurnal(rows, konteks);

    expect(html.indexOf("DEBET")).toBeLessThan(html.indexOf("KREDIT"));
  });
});
