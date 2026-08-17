import { describe, expect, it } from "vitest";

import { filterPenjualan } from "@/app/penjualan/lib/filterPenjualan";
import type { Penjualan, PenjualanFilter } from "@/app/penjualan/lib/types";

const rows: Penjualan[] = [
  {
    kodejual      : "PJ-20260810-0001",
    tanggal       : "2026-08-10",
    jenistransaksi: "POS",
    kodecustomer  : "CUST-0006",
    namacustomer  : "Pelanggan Umum (Walk-in)",
    items         : [],
    total         : 75000,
    diskon        : 0,
    ppn           : 0,
    grandtotal    : 75000,
    status        : "S",
  },
  {
    kodejual      : "PJ-20260812-0001",
    tanggal       : "2026-08-12",
    jenistransaksi: "PESANAN",
    kodecustomer  : "CUST-0001",
    namacustomer  : "Budi Santoso",
    items         : [],
    total         : 660000,
    diskon        : 0,
    ppn           : 0,
    grandtotal    : 660000,
    status        : "S",
  },
];

const baseFilter: PenjualanFilter = {
  query         : "",
  jenistransaksi: "SEMUA",
  tanggalDari   : "",
  tanggalSampai : "",
};

describe("filterPenjualan", () => {
  it("returns every row when filter is empty", () => {
    expect(filterPenjualan(rows, baseFilter)).toEqual(rows);
  });

  it("matches rows whose kode contains the query", () => {
    expect(filterPenjualan(rows, { ...baseFilter, query: "0001" })).toEqual(rows);
    expect(filterPenjualan(rows, { ...baseFilter, query: "20260810" })).toEqual([rows[0]]);
  });

  it("matches rows whose customer name contains the query", () => {
    expect(filterPenjualan(rows, { ...baseFilter, query: "budi" })).toEqual([rows[1]]);
  });

  it("filters by jenistransaksi", () => {
    expect(filterPenjualan(rows, { ...baseFilter, jenistransaksi: "POS" })).toEqual([rows[0]]);
    expect(filterPenjualan(rows, { ...baseFilter, jenistransaksi: "PESANAN" })).toEqual([rows[1]]);
  });

  it("filters by date range", () => {
    expect(filterPenjualan(rows, { ...baseFilter, tanggalDari: "2026-08-11" })).toEqual([rows[1]]);
    expect(filterPenjualan(rows, { ...baseFilter, tanggalSampai: "2026-08-11" })).toEqual([rows[0]]);
  });
});
