import { describe, expect, it } from "vitest";

import { filterPembelian } from "@/app/transaksi/pembelian/lib/filterPembelian";
import type { PembelianFilter } from "@/app/transaksi/pembelian/lib/types";
import type { Pembelian } from "@/lib/server/pembelian/types";

const rows: Pembelian[] = [
  {
    kodebeli    : "PB2608050001",
    tanggal     : "2026-08-05",
    kodesupplier: "SUP-0001",
    namasupplier: "PT Sumber Berkah Pangan",
    kodelokasi  : "LOK-0001",
    namalokasi  : "Toko Utama",
    items       : [],
    total       : 2980000,
    diskon      : 0,
    ppn         : 0,
    grandtotal  : 2980000,
    status      : "S",
    alasanbatal : null,
  },
  {
    kodebeli    : "PB2608130001",
    tanggal     : "2026-08-13",
    kodesupplier: "SUP-0003",
    namasupplier: "PT Distributor Sembako Nusantara",
    kodelokasi  : "LOK-0001",
    namalokasi  : "Toko Utama",
    items       : [],
    total       : 500000,
    diskon      : 0,
    ppn         : 0,
    grandtotal  : 500000,
    status      : "D",
    alasanbatal : "Barang tidak sesuai",
  },
];

const baseFilter: PembelianFilter = {
  query        : "",
  tanggalDari  : "",
  tanggalSampai: "",
};

describe("filterPembelian", () => {
  it("returns every row when filter is empty", () => {
    expect(filterPembelian(rows, baseFilter)).toEqual(rows);
  });

  it("matches rows whose kode contains the query", () => {
    expect(filterPembelian(rows, { ...baseFilter, query: "0805" })).toEqual([rows[0]]);
  });

  it("matches rows whose supplier name contains the query", () => {
    expect(filterPembelian(rows, { ...baseFilter, query: "Nusantara" })).toEqual([rows[1]]);
  });

  it("filters by date range", () => {
    expect(filterPembelian(rows, { ...baseFilter, tanggalDari: "2026-08-06" })).toEqual([rows[1]]);
    expect(filterPembelian(rows, { ...baseFilter, tanggalSampai: "2026-08-06" })).toEqual([rows[0]]);
  });
});
