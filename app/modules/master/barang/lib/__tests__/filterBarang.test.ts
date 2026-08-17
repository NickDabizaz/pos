import { describe, expect, it } from "vitest";

import { filterBarang } from "@/app/modules/master/barang/lib/filterBarang";
import type { Barang } from "@/app/modules/master/barang/lib/types";

const rows: Barang[] = [
  { kodebarang: "BRG-0001", namabarang: "Beras 5kg", kategori: "Makanan", satuan: "Karung", hargabeli: 55000, hargajual: 65000, stok: 40 },
  { kodebarang: "BRG-0002", namabarang: "Teh Botol", kategori: "Minuman", satuan: "Botol", hargabeli: 3000, hargajual: 5000, stok: 100 },
];

describe("filterBarang", () => {
  it("returns every row when query and kategori are empty", () => {
    expect(filterBarang(rows, "", "")).toEqual(rows);
  });

  it("matches rows whose name contains the query, case-insensitively", () => {
    expect(filterBarang(rows, "beras", "")).toEqual([rows[0]]);
  });

  it("matches rows whose kode contains the query", () => {
    expect(filterBarang(rows, "0002", "")).toEqual([rows[1]]);
  });

  it("matches rows by exact kategori", () => {
    expect(filterBarang(rows, "", "Minuman")).toEqual([rows[1]]);
  });

  it("requires both query and kategori to match when both are set", () => {
    expect(filterBarang(rows, "beras", "Minuman")).toEqual([]);
  });
});
