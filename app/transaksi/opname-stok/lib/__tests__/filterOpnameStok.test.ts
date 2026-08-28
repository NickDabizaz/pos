import { describe, expect, it } from "vitest";

import { filterOpnameStok } from "@/app/transaksi/opname-stok/lib/filterOpnameStok";
import type { OpnameStokFilter } from "@/app/transaksi/opname-stok/lib/types";
import type { OpnameStok } from "@/lib/server/opnamestok/types";

function buatDokumen(overrides: Partial<OpnameStok> = {}): OpnameStok {
  return {
    kodeopname : "OS2608280001",
    tanggal    : "2026-08-28",
    kodelokasi : "TOKO",
    namalokasi : "Toko Utama",
    items      : [],
    status     : "S",
    alasanbatal: null,
    ...overrides,
  };
}

const filterKosong: OpnameStokFilter = {
  query        : "",
  tanggalDari  : "",
  tanggalSampai: "",
  status       : "SEMUA",
};

describe("filterOpnameStok", () => {
  it("tanpa filter mengembalikan semua dokumen", () => {
    const items = [buatDokumen(), buatDokumen({ kodeopname: "OS2608280002" })];

    expect(filterOpnameStok(items, filterKosong)).toHaveLength(2);
  });

  it("query menyaring berdasarkan kode dan nama lokasi", () => {
    const items = [
      buatDokumen({ kodeopname: "OS2608280001", namalokasi: "Toko Utama" }),
      buatDokumen({ kodeopname: "OS2608280002", namalokasi: "Gudang Pusat" }),
    ];

    expect(filterOpnameStok(items, { ...filterKosong, query: "gudang" })).toHaveLength(1);
    expect(filterOpnameStok(items, { ...filterKosong, query: "280001" })).toHaveLength(1);
  });

  it("rentang tanggal menyaring inklusif di kedua ujung", () => {
    const items = [
      buatDokumen({ kodeopname: "a", tanggal: "2026-08-01" }),
      buatDokumen({ kodeopname: "b", tanggal: "2026-08-15" }),
      buatDokumen({ kodeopname: "c", tanggal: "2026-08-31" }),
    ];

    const hasil = filterOpnameStok(items, { ...filterKosong, tanggalDari: "2026-08-15", tanggalSampai: "2026-08-31" });

    expect(hasil.map((item) => item.kodeopname)).toEqual(["b", "c"]);
  });

  it("filter status memisahkan dokumen dibatalkan dari yang tersimpan", () => {
    const items = [
      buatDokumen({ kodeopname: "tersimpan", status: "S" }),
      buatDokumen({ kodeopname: "dibatalkan", status: "D" }),
    ];

    expect(filterOpnameStok(items, { ...filterKosong, status: "D" }).map((item) => item.kodeopname)).toEqual(["dibatalkan"]);
    expect(filterOpnameStok(items, { ...filterKosong, status: "S" }).map((item) => item.kodeopname)).toEqual(["tersimpan"]);
  });
});
