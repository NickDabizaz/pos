import { describe, expect, it } from "vitest";

import { filterBarang } from "@/app/master/barang/lib/filterBarang";
import type { Barang } from "@/app/master/barang/lib/types";

const rows: Barang[] = [
  { kodebarang: "BRG-0001", namabarang: "Beras 5kg", barcode: "8991002100017", satuan: "Karung", hargabeli: 55000, hargajual: 65000, pakaiStok: true, status: 1 },
  { kodebarang: "BRG-0002", namabarang: "Teh Botol", barcode: "8991002100024", satuan: "Botol", hargabeli: 3000, hargajual: 5000, pakaiStok: true, status: 1 },
];

describe("filterBarang", () => {
  it("returns every row when query is empty", () => {
    expect(filterBarang(rows, "")).toEqual(rows);
  });

  it("matches rows whose name contains the query, case-insensitively", () => {
    expect(filterBarang(rows, "beras")).toEqual([rows[0]]);
  });

  it("matches rows whose kode contains the query", () => {
    expect(filterBarang(rows, "0002")).toEqual([rows[1]]);
  });
});
