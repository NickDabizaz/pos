import { describe, expect, it } from "vitest";

import { addEmptyRow, removeRow, selectBarangForRow, updateRowField } from "@/components/ItemLinesTable/lib/itemLines";
import type { Barang } from "@/lib/server/barang/types";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

const barang: Barang = {
  idbarang  : 1,
  kodebarang: "BRG-0001",
  namabarang: "Beras 5kg",
  barcode   : "8991002100017",
  satuan    : "Karung",
  hargabeli : 55000,
  hargajual : 65000,
  pakaistok : true,
  status    : 1,
};

describe("addEmptyRow", () => {
  it("appends a blank row without touching existing rows", () => {
    const result = addEmptyRow([]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ kodebarang: "", qty: 1, harga: 0 });
  });

  it("allows multiple blank rows to coexist", () => {
    const result = addEmptyRow(addEmptyRow([]));

    expect(result).toHaveLength(2);
  });
});

describe("removeRow", () => {
  it("removes only the row at the given index", () => {
    const rows = addEmptyRow(addEmptyRow([]));

    expect(removeRow(rows, 0)).toHaveLength(1);
  });
});

describe("selectBarangForRow", () => {
  it("fills kode/nama/satuan/harga from the master barang using the given price field", () => {
    const rows   = addEmptyRow([]);
    const result = selectBarangForRow(rows, 0, barang, "hargajual");

    expect(result[0]).toMatchObject({
      kodebarang: "BRG-0001",
      namabarang: "Beras 5kg",
      satuan    : "Karung",
      harga     : 65000,
      qty       : 1,
    });
  });

  it("uses hargabeli when priceField is hargabeli", () => {
    const rows   = addEmptyRow([]);
    const result = selectBarangForRow(rows, 0, barang, "hargabeli");

    expect(result[0].harga).toBe(55000);
  });

  it("only touches the row at the given index", () => {
    const rows   = addEmptyRow(addEmptyRow([]));
    const result = selectBarangForRow(rows, 1, barang, "hargajual");

    expect(result[0].kodebarang).toBe("");
    expect(result[1].kodebarang).toBe("BRG-0001");
  });
});

describe("updateRowField", () => {
  const filledRow: TransaksiItem = {
    kodebarang: "BRG-0001",
    namabarang: "Beras 5kg",
    satuan    : "Karung",
    qty       : 1,
    harga     : 65000,
    pakaiPpn  : "TIDAK",
    diskon    : 0,
    ppn       : 0,
    subtotal  : 65000,
  };

  it("updates qty and recomputes subtotal", () => {
    const result = updateRowField([filledRow], 0, "qty", 3);

    expect(result[0].qty).toBe(3);
    expect(result[0].subtotal).toBe(195000);
  });

  it("updates pakaiPpn and recomputes ppn", () => {
    const result = updateRowField([filledRow], 0, "pakaiPpn", "EXCLUDE");

    expect(result[0].ppn).toBeCloseTo(7150);
  });

  it("updates diskon and recomputes subtotal", () => {
    const result = updateRowField([filledRow], 0, "diskon", 5000);

    expect(result[0].subtotal).toBe(60000);
  });
});
