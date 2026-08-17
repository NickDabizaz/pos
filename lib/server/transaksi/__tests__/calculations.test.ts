import { describe, expect, it } from "vitest";

import {
  calculateHeaderTotals,
  calculateLinePpn,
  calculateLineSubtotal,
  withComputedAmounts,
} from "@/lib/server/transaksi/calculations";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

describe("calculateLinePpn", () => {
  it("returns 0 when ppn is not used", () => {
    expect(calculateLinePpn(2, 10000, 0, "TIDAK")).toBe(0);
  });

  it("adds ppn on top of the base when excluded from the price", () => {
    expect(calculateLinePpn(2, 10000, 0, "EXCLUDE")).toBeCloseTo(2200);
  });

  it("extracts the embedded ppn when included in the price", () => {
    expect(calculateLinePpn(1, 11100, 0, "INCLUDE")).toBeCloseTo(1100, 0);
  });

  it("computes ppn against the discounted base", () => {
    expect(calculateLinePpn(2, 10000, 5000, "EXCLUDE")).toBeCloseTo(1650);
  });
});

describe("calculateLineSubtotal", () => {
  it("is qty * harga - diskon when ppn is not used", () => {
    expect(calculateLineSubtotal(3, 5000, 1000, "TIDAK")).toBe(14000);
  });

  it("adds ppn on top when excluded from the price", () => {
    expect(calculateLineSubtotal(2, 10000, 0, "EXCLUDE")).toBeCloseTo(22200);
  });

  it("keeps the base unchanged when ppn is already included", () => {
    expect(calculateLineSubtotal(1, 11100, 0, "INCLUDE")).toBe(11100);
  });
});

describe("withComputedAmounts", () => {
  it("fills in ppn and subtotal for the given line", () => {
    const result = withComputedAmounts({
      diskon    : 0,
      harga     : 10000,
      kodebarang: "BRG-0001",
      namabarang: "Beras 5kg",
      pakaiPpn  : "EXCLUDE",
      qty       : 2,
      satuan    : "Karung",
    });

    expect(result.ppn).toBeCloseTo(2200);
    expect(result.subtotal).toBeCloseTo(22200);
  });
});

describe("calculateHeaderTotals", () => {
  const items: TransaksiItem[] = [
    { kodebarang: "BRG-0001", namabarang: "Beras 5kg", satuan: "Karung", qty: 2, harga: 10000, pakaiPpn: "EXCLUDE", diskon: 0, ppn: 2200, subtotal: 22200 },
    { kodebarang: "BRG-0002", namabarang: "Teh Botol", satuan: "Botol", qty: 5, harga: 5000, pakaiPpn: "TIDAK", diskon: 1000, ppn: 0, subtotal: 24000 },
  ];

  it("sums total, diskon, ppn from qty*harga and per-line fields", () => {
    const totals = calculateHeaderTotals(items);

    expect(totals.total).toBe(45000);
    expect(totals.diskon).toBe(1000);
    expect(totals.ppn).toBe(2200);
  });

  it("computes grandtotal as total - diskon + ppn", () => {
    const totals = calculateHeaderTotals(items);

    expect(totals.grandtotal).toBe(46200);
  });
});
