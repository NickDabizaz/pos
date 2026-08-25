import { describe, expect, it } from "vitest";

import { buatCatatanKartuStok } from "@/lib/server/kartustok/catatan";

describe("Catatan Kartu Stok mengikuti pola tetap per jenis transaksi", () => {
  it("PENJUALAN atas INDOMIE GORENG kepada TOKO MAJU menghasilkan PENJUALAN INDOMIE GORENG KE TOKO MAJU", () => {
    const hasil = buatCatatanKartuStok({
      jenistransaksi: "PENJUALAN",
      namabarang    : "INDOMIE GORENG",
      namacustomer  : "TOKO MAJU",
    });

    expect(hasil).toBe("PENJUALAN INDOMIE GORENG KE TOKO MAJU");
  });

  it("POS atas INDOMIE GORENG kepada TOKO MAJU menghasilkan POS INDOMIE GORENG KE TOKO MAJU", () => {
    const hasil = buatCatatanKartuStok({
      jenistransaksi: "POS",
      namabarang    : "INDOMIE GORENG",
      namacustomer  : "TOKO MAJU",
    });

    expect(hasil).toBe("POS INDOMIE GORENG KE TOKO MAJU");
  });

  it("PEMBELIAN atas INDOMIE GORENG dari PT SUMBER PANGAN menghasilkan PEMBELIAN INDOMIE GORENG DARI PT SUMBER PANGAN", () => {
    const hasil = buatCatatanKartuStok({
      jenistransaksi: "PEMBELIAN",
      namabarang    : "INDOMIE GORENG",
      namasupplier  : "PT SUMBER PANGAN",
    });

    expect(hasil).toBe("PEMBELIAN INDOMIE GORENG DARI PT SUMBER PANGAN");
  });
});

describe("Catatan Kartu Stok selalu UPPERCASE", () => {
  it("nama Barang Indomie Goreng dan nama Customer Toko Maju tetap keluar sebagai PENJUALAN INDOMIE GORENG KE TOKO MAJU", () => {
    const hasil = buatCatatanKartuStok({
      jenistransaksi: "PENJUALAN",
      namabarang    : "Indomie Goreng",
      namacustomer  : "Toko Maju",
    });

    expect(hasil).toBe("PENJUALAN INDOMIE GORENG KE TOKO MAJU");
  });
});

describe("Catatan Kartu Stok dipotong maksimal 255 karakter", () => {
  const NAMABARANG_100 = "B".repeat(100);
  const NAMACUSTOMER_100 = "C".repeat(100);

  it("nama Barang 100 karakter dan nama Customer 100 karakter menghasilkan catatan utuh, panjang di bawah 255, tidak terpotong", () => {
    const hasil = buatCatatanKartuStok({
      jenistransaksi: "PENJUALAN",
      namabarang    : NAMABARANG_100,
      namacustomer  : NAMACUSTOMER_100,
    });

    expect(hasil).toBe(`PENJUALAN ${NAMABARANG_100} KE ${NAMACUSTOMER_100}`);
    expect(hasil.length).toBeLessThan(255);
  });

  it("nama Customer yang membuat hasil tepat 255 karakter dikembalikan utuh, tidak hilang satu karakter pun", () => {
    const namacustomer = "C".repeat(240);
    const hasil = buatCatatanKartuStok({ jenistransaksi: "PENJUALAN", namabarang: "X", namacustomer });

    expect(hasil.length).toBe(255);
    expect(hasil).toBe(`PENJUALAN X KE ${namacustomer}`);
  });

  it("nama Customer yang membuat hasil 256 karakter dipotong menjadi tepat 255 karakter, dan 255 karakter pertamanya sama persis dengan hasil sebelum dipotong", () => {
    const namacustomer = "C".repeat(241);
    const sebelumDipotong = `PENJUALAN X KE ${namacustomer}`;

    const hasil = buatCatatanKartuStok({ jenistransaksi: "PENJUALAN", namabarang: "X", namacustomer });

    expect(sebelumDipotong.length).toBe(256);
    expect(hasil.length).toBe(255);
    expect(hasil).toBe(sebelumDipotong.slice(0, 255));
  });
});

describe("Formatter Kartu Stok tidak melakukan query lookup", () => {
  it("dipanggil cukup dengan nama-nama dari pemanggil, tanpa DatabasePerusahaanClient sama sekali", () => {
    const hasil = buatCatatanKartuStok({
      jenistransaksi: "PEMBELIAN",
      namabarang    : "Gula Pasir",
      namasupplier  : "PT Sumber Pangan",
    });

    expect(hasil).toBe("PEMBELIAN GULA PASIR DARI PT SUMBER PANGAN");
  });
});
