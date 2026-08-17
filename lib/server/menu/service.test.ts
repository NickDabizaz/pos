import { describe, expect, it } from "vitest";

import { buildMenuTree } from "@/lib/server/menu/service";

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
