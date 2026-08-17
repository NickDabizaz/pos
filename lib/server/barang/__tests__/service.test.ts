import { beforeEach, describe, expect, it } from "vitest";

import { resetBarangStoreForTests } from "@/lib/server/barang/repository";
import {
  BarangNotFoundError,
  createBarang,
  deleteBarang,
  DuplicateKodeError,
  generateKodeBarang,
  listBarang,
  updateBarang,
} from "@/lib/server/barang/service";
import type { Barang } from "@/lib/server/barang/types";

const newBarang: Barang = {
  kodebarang: "BRG-9999",
  namabarang: "Item Baru",
  barcode   : "8991002199999",
  satuan    : "Pcs",
  hargabeli : 1000,
  hargajual : 1500,
  pakaiStok : true,
  status    : 1,
};

beforeEach(() => {
  resetBarangStoreForTests();
});

describe("createBarang", () => {
  it("adds the item and it shows up in listBarang", () => {
    createBarang(newBarang);

    expect(listBarang()).toContainEqual(newBarang);
  });

  it("rejects a kodebarang that already exists", () => {
    createBarang(newBarang);

    expect(() => createBarang(newBarang)).toThrow(DuplicateKodeError);
  });
});

describe("updateBarang", () => {
  it("replaces the item's fields", () => {
    createBarang(newBarang);

    const updated = updateBarang(newBarang.kodebarang, { ...newBarang, namabarang: "Item Diubah" });

    expect(updated.namabarang).toBe("Item Diubah");
    expect(listBarang()).toContainEqual({ ...newBarang, namabarang: "Item Diubah" });
  });

  it("throws when the kodebarang does not exist", () => {
    expect(() => updateBarang("BRG-MISSING", newBarang)).toThrow(BarangNotFoundError);
  });
});

describe("deleteBarang", () => {
  it("removes the item from listBarang", () => {
    createBarang(newBarang);

    deleteBarang(newBarang.kodebarang);

    expect(listBarang()).not.toContainEqual(newBarang);
  });

  it("throws when the kodebarang does not exist", () => {
    expect(() => deleteBarang("BRG-MISSING")).toThrow(BarangNotFoundError);
  });
});

describe("generateKodeBarang", () => {
  it("produces a non-empty code not already used by an existing item", () => {
    const generated = generateKodeBarang();

    expect(generated).toMatch(/^BRG-AUTO-\d+$/);
    expect(listBarang().some((item) => item.kodebarang === generated)).toBe(false);
  });
});
