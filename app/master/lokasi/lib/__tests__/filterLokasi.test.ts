import { describe, expect, it } from "vitest";

import { filterLokasi } from "@/app/master/lokasi/lib/filterLokasi";
import type { Lokasi } from "@/app/master/lokasi/lib/types";

const rows: Lokasi[] = [
  { kodelokasi: "LOK-0001", namalokasi: "Toko Utama (Kasir Depan)", keterangan: "Display etalase", status: 1 },
  { kodelokasi: "LOK-0002", namalokasi: "Gudang Belakang", keterangan: "Penyimpanan stok", status: 1 },
];

describe("filterLokasi", () => {
  it("returns every row when query is empty", () => {
    expect(filterLokasi(rows, "")).toEqual(rows);
  });

  it("matches rows whose name contains the query, case-insensitively", () => {
    expect(filterLokasi(rows, "toko")).toEqual([rows[0]]);
  });

  it("matches rows whose kode contains the query", () => {
    expect(filterLokasi(rows, "0002")).toEqual([rows[1]]);
  });
});
