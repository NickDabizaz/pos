import { describe, expect, it } from "vitest";

import { bolehAksesMenu, buildMenuTree, filterMenuUntukPengguna, kodemenuUntukRute } from "@/lib/server/menu/service";
import type { MenuNode } from "@/lib/server/menu/types";

describe("buildMenuTree", () => {
  it("returns an empty tree for an empty row list", () => {
    expect(buildMenuTree([])).toEqual([]);
  });

  it("places a row with no parent at the root", () => {
    const rows = [
      { kodemenu: "M01", kodeinduk: null, namamenu: "Master", jenis: "HEADER", urutan: "1" },
    ];

    expect(buildMenuTree(rows)).toEqual([
      { kodemenu: "M01", namamenu: "Master", jenis: "HEADER", urutan: "1", children: [] },
    ]);
  });

  it("nests a row under its parent via kodeinduk", () => {
    const rows = [
      { kodemenu: "M01", kodeinduk: null, namamenu: "Master", jenis: "HEADER", urutan: "1" },
      { kodemenu: "M01D1", kodeinduk: "M01", namamenu: "Produk", jenis: "DETAIL", urutan: "1" },
    ];

    expect(buildMenuTree(rows)).toEqual([
      {
        kodemenu: "M01",
        namamenu: "Master",
        jenis   : "HEADER",
        urutan  : "1",
        children: [
          { kodemenu: "M01D1", namamenu: "Produk", jenis: "DETAIL", urutan: "1", children: [] },
        ],
      },
    ]);
  });

  it("treats a row with a dangling kodeinduk as a root", () => {
    const rows = [
      { kodemenu: "M01D1", kodeinduk: "MISSING", namamenu: "Produk", jenis: "DETAIL", urutan: "1" },
    ];

    expect(buildMenuTree(rows)).toEqual([
      { kodemenu: "M01D1", namamenu: "Produk", jenis: "DETAIL", urutan: "1", children: [] },
    ]);
  });
});

describe("kodemenuUntukRute", () => {
  it("mengembalikan kodemenu untuk rute yang terdaftar di pemetaan", () => {
    expect(kodemenuUntukRute("GET /api/menu/tree")).toBe("MDATA-LOK");
  });

  it("melempar kegagalan yang jelas untuk rute yang tidak terdaftar, bukan diam-diam meloloskan akses", () => {
    expect(() => kodemenuUntukRute("GET /api/rute/tidak-ada")).toThrow(/belum terdaftar/);
  });
});

describe("bolehAksesMenu", () => {
  it("Owner selalu lolos walau kodemenuDiizinkan kosong", () => {
    expect(bolehAksesMenu({ isOwner: true, kodemenuDiizinkan: new Set(), kodemenu: "M01D1" })).toBe(true);
  });

  it("karyawan lolos hanya untuk kodemenu yang ada di kodemenuDiizinkan", () => {
    const kodemenuDiizinkan = new Set(["M01D1"]);

    expect(bolehAksesMenu({ isOwner: false, kodemenuDiizinkan, kodemenu: "M01D1" })).toBe(true);
    expect(bolehAksesMenu({ isOwner: false, kodemenuDiizinkan, kodemenu: "M02D1" })).toBe(false);
  });
});

describe("filterMenuUntukPengguna", () => {
  const tree: MenuNode[] = [
    {
      kodemenu: "M01",
      namamenu: "Master",
      jenis   : "HEADER",
      urutan  : "1",
      children: [
        { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL", urutan: "1", children: [] },
        { kodemenu: "M02D1", namamenu: "Barang", jenis: "DETAIL", urutan: "2", children: [] },
      ],
    },
  ];

  it("Owner melihat seluruh Menu aktif walau tidak punya satu pun baris Hak Menu", () => {
    expect(filterMenuUntukPengguna(tree, { isOwner: true, kodemenuDiizinkan: new Set() })).toEqual(tree);
  });

  it("karyawan dengan Hak Menu aktif hanya untuk satu kodemenu hanya melihat menu itu beserta induknya", () => {
    const hasil = filterMenuUntukPengguna(tree, { isOwner: false, kodemenuDiizinkan: new Set(["M01D1"]) });

    expect(hasil).toEqual([
      {
        kodemenu: "M01",
        namamenu: "Master",
        jenis   : "HEADER",
        urutan  : "1",
        children: [
          { kodemenu: "M01D1", namamenu: "Lokasi", jenis: "DETAIL", urutan: "1", children: [] },
        ],
      },
    ]);
  });

  it("karyawan tanpa satu pun Hak Menu melihat Sidebar kosong, bukan error dan bukan seluruh menu", () => {
    expect(filterMenuUntukPengguna(tree, { isOwner: false, kodemenuDiizinkan: new Set() })).toEqual([]);
  });
});
