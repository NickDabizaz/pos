import { describe, expect, it } from "vitest";

import { menuRoutes } from "@/lib/menuRoutes";

describe("menuRoutes: ketujuh LAP-* memetakan ke /laporan/<nama>", () => {
  it.each([
    ["LAP-JUL", "/laporan/penjualan"],
    ["LAP-BEL", "/laporan/pembelian"],
    ["LAP-KAS", "/laporan/kas"],
    ["LAP-OPS", "/laporan/opname-stok"],
    ["LAP-KST", "/laporan/kartu-stok"],
    ["LAP-PST", "/laporan/posisi-stok"],
    ["LAP-JRN", "/laporan/jurnal"],
  ])("%s -> %s", (kodemenu, route) => {
    expect(menuRoutes[kodemenu]).toBe(route);
  });
});
