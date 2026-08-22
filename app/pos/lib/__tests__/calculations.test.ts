import { describe, expect, it } from "vitest";

import {
  calculateChange,
  calculateGrandTotal,
  calculateSubtotal,
  generateQuickCashSuggestions,
} from "@/app/pos/lib/calculations";
import type { CartItem } from "@/app/pos/lib/types";
import { formatRupiah } from "@/lib/format";

describe("calculations", () => {
  const sampleItems: CartItem[] = [
    {
      barang: {
        barcode   : "8991002100017",
        hargabeli : 50000,
        hargajual : 65000,
        kodebarang: "BRG-0001",
        namabarang: "Beras 5kg",
        pakaiStok : true,
        satuan    : "Karung",
        status    : 1,
      },
      qty: 2,
    },
    {
      barang: {
        barcode   : "8991002100024",
        hargabeli : 3000,
        hargajual : 5000,
        kodebarang: "BRG-0002",
        namabarang: "Teh Botol",
        pakaiStok : true,
        satuan    : "Botol",
        status    : 1,
      },
      qty: 3,
    },
  ];

  it("calculates cart subtotal correctly", () => {
    const subtotal = calculateSubtotal(sampleItems);
    expect(subtotal).toBe(145000);
  });

  it("calculates grand total with discount correctly", () => {
    const subtotal = 145000;
    const discount = 15000;
    expect(calculateGrandTotal(subtotal, discount)).toBe(130000);
    expect(calculateGrandTotal(subtotal, 0)).toBe(145000);
    expect(calculateGrandTotal(10000, 20000)).toBe(0);
  });

  it("calculates change correctly", () => {
    expect(calculateChange(130000, 150000)).toBe(20000);
    expect(calculateChange(130000, 130000)).toBe(0);
    expect(calculateChange(130000, 100000)).toBe(0);
  });

  it("formats Rupiah properly", () => {
    const formatted = formatRupiah(50000);
    expect(formatted).toContain("50.000");
  });

  it("generates practical quick cash suggestions", () => {
    const suggestions = generateQuickCashSuggestions(37500);
    expect(suggestions).toContain(37500);
    expect(suggestions).toContain(40000);
    expect(suggestions).toContain(50000);
    expect(suggestions).toContain(100000);
  });
});
