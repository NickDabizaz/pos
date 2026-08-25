import { describe, expect, it } from "vitest";

import { buatCatatanJurnal } from "@/lib/server/jurnal/catatan";

describe("Catatan Jurnal mengikuti pola tetap per jenis transaksi", () => {
  it("Jurnal PENJUALAN kepada TOKO MAJU menghasilkan PENJUALAN KEPADA TOKO MAJU", () => {
    const hasil = buatCatatanJurnal({ jenistransaksi: "PENJUALAN", namacustomer: "TOKO MAJU" });

    expect(hasil).toBe("PENJUALAN KEPADA TOKO MAJU");
  });

  it("Jurnal POS kepada TOKO MAJU menghasilkan POS KEPADA TOKO MAJU", () => {
    const hasil = buatCatatanJurnal({ jenistransaksi: "POS", namacustomer: "TOKO MAJU" });

    expect(hasil).toBe("POS KEPADA TOKO MAJU");
  });

  it("Jurnal PEMBELIAN dari PT SUMBER PANGAN menghasilkan PEMBELIAN DARI PT SUMBER PANGAN", () => {
    const hasil = buatCatatanJurnal({ jenistransaksi: "PEMBELIAN", namasupplier: "PT SUMBER PANGAN" });

    expect(hasil).toBe("PEMBELIAN DARI PT SUMBER PANGAN");
  });

  it("Jurnal KAS MASUK dengan keterangan Setoran modal menghasilkan KAS MASUK SETORAN MODAL", () => {
    const hasil = buatCatatanJurnal({ jenistransaksi: "KAS MASUK", keterangan: "Setoran modal" });

    expect(hasil).toBe("KAS MASUK SETORAN MODAL");
  });

  it("Jurnal KAS KELUAR dengan keterangan Bayar listrik menghasilkan KAS KELUAR BAYAR LISTRIK", () => {
    const hasil = buatCatatanJurnal({ jenistransaksi: "KAS KELUAR", keterangan: "Bayar listrik" });

    expect(hasil).toBe("KAS KELUAR BAYAR LISTRIK");
  });
});

describe("Catatan Jurnal selalu UPPERCASE", () => {
  it("keterangan Kas bayar listrik agustus keluar sebagai KAS KELUAR BAYAR LISTRIK AGUSTUS", () => {
    const hasil = buatCatatanJurnal({ jenistransaksi: "KAS KELUAR", keterangan: "bayar listrik agustus" });

    expect(hasil).toBe("KAS KELUAR BAYAR LISTRIK AGUSTUS");
  });
});

describe("Catatan Jurnal dipotong maksimal 255 karakter", () => {
  it("keterangan yang membuat hasil tepat 255 karakter dikembalikan utuh, tidak hilang satu karakter pun", () => {
    const keterangan = "K".repeat(255 - "KAS MASUK ".length);
    const hasil = buatCatatanJurnal({ jenistransaksi: "KAS MASUK", keterangan });

    expect(hasil.length).toBe(255);
    expect(hasil).toBe(`KAS MASUK ${keterangan}`);
  });

  it("keterangan yang membuat hasil 256 karakter dipotong menjadi tepat 255 karakter, dan 255 karakter pertamanya sama persis dengan hasil sebelum dipotong", () => {
    const keterangan = "K".repeat(256 - "KAS MASUK ".length);
    const sebelumDipotong = `KAS MASUK ${keterangan}`;

    const hasil = buatCatatanJurnal({ jenistransaksi: "KAS MASUK", keterangan });

    expect(sebelumDipotong.length).toBe(256);
    expect(hasil.length).toBe(255);
    expect(hasil).toBe(sebelumDipotong.slice(0, 255));
  });
});

describe("Formatter Jurnal tidak melakukan query lookup", () => {
  it("dipanggil cukup dengan nama dari pemanggil, tanpa DatabasePerusahaanClient sama sekali", () => {
    const hasil = buatCatatanJurnal({ jenistransaksi: "PEMBELIAN", namasupplier: "CV Makmur Sentosa" });

    expect(hasil).toBe("PEMBELIAN DARI CV MAKMUR SENTOSA");
  });
});
