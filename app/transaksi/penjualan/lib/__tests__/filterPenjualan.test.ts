import { describe, expect, it } from "vitest";

import { filterPenjualan } from "@/app/transaksi/penjualan/lib/filterPenjualan";
import type { PenjualanFilter } from "@/app/transaksi/penjualan/lib/types";
import type { Penjualan } from "@/lib/server/penjualan/types";

const rows: Penjualan[] = [
  {
    kodejual      : "JL2608100001",
    tanggal       : "2026-08-10",
    jenistransaksi: "POS",
    kodecustomer  : "CUST-0006",
    namacustomer  : "Pelanggan Umum (Walk-in)",
    kodelokasi    : "LOK-0001",
    namalokasi    : "Toko Utama",
    items         : [],
    total         : 75000,
    diskon        : 0,
    ppn           : 0,
    grandtotal    : 75000,
    status        : "S",
    alasanbatal   : null,
    pembayaran    : { tunai: 75000, nontunai: 0, kembalian: 0 },
  },
  {
    kodejual      : "JL2608120001",
    tanggal       : "2026-08-12",
    jenistransaksi: "PESANAN",
    kodecustomer  : "CUST-0001",
    namacustomer  : "Budi Santoso",
    kodelokasi    : "LOK-0001",
    namalokasi    : "Toko Utama",
    items         : [],
    total         : 660000,
    diskon        : 0,
    ppn           : 0,
    grandtotal    : 660000,
    status        : "S",
    alasanbatal   : null,
    pembayaran    : { tunai: 660000, nontunai: 0, kembalian: 0 },
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
    expect(filterPenjualan(rows, { ...baseFilter, query: "0810" })).toEqual([rows[0]]);
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
