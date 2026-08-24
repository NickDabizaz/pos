import { describe, expect, it } from "vitest";

import { filterKas } from "@/app/transaksi/kas/lib/filterKas";
import type { Kas, KasFilter } from "@/app/transaksi/kas/lib/types";

const emptyFilter: KasFilter = {
  query        : "",
  jenis        : "SEMUA",
  kodelokasi   : "SEMUA",
  tanggalDari  : "",
  tanggalSampai: "",
};

const items: Kas[] = [
  {
    kodekas   : "KS2608240001",
    tanggal   : "2026-08-24",
    jenis     : "MASUK",
    kodelokasi: "LOK01",
    namalokasi: "Toko Utama",
    rincian   : [{ keterangan: "Setoran modal", nominal: 100000 }],
    grandtotal: 100000,
    status    : "S",
    alasanbatal: null,
  },
  {
    kodekas   : "KS2608250001",
    tanggal   : "2026-08-25",
    jenis     : "KELUAR",
    kodelokasi: "LOK02",
    namalokasi: "Gudang",
    rincian   : [{ keterangan: "Beli galon", nominal: 50000 }],
    grandtotal: 50000,
    status    : "D",
    alasanbatal: "Salah input",
  },
];

describe("filterKas", () => {
  it("returns all items with an empty filter", () => {
    expect(filterKas(items, emptyFilter)).toHaveLength(2);
  });

  it("filters by jenis", () => {
    expect(filterKas(items, { ...emptyFilter, jenis: "KELUAR" })).toEqual([items[1]]);
  });

  it("filters by kodelokasi", () => {
    expect(filterKas(items, { ...emptyFilter, kodelokasi: "LOK01" })).toEqual([items[0]]);
  });

  it("filters by query matching kodekas or rincian keterangan", () => {
    expect(filterKas(items, { ...emptyFilter, query: "galon" })).toEqual([items[1]]);
    expect(filterKas(items, { ...emptyFilter, query: "KS2608240001" })).toEqual([items[0]]);
  });

  it("filters by tanggal range", () => {
    expect(filterKas(items, { ...emptyFilter, tanggalDari: "2026-08-25" })).toEqual([items[1]]);
    expect(filterKas(items, { ...emptyFilter, tanggalSampai: "2026-08-24" })).toEqual([items[0]]);
  });
});
