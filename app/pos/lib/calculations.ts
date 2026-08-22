import type { CartItem } from "@/app/pos/lib/types";

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.barang.hargajual * item.qty, 0);
}

export function calculateGrandTotal(subtotal: number, discount = 0): number {
  const finalTotal = subtotal - discount;
  return finalTotal > 0 ? finalTotal : 0;
}

export function calculateChange(grandTotal: number, amountPaid: number): number {
  if (amountPaid < grandTotal) return 0;
  return amountPaid - grandTotal;
}

export function generateQuickCashSuggestions(grandTotal: number): number[] {
  if (grandTotal <= 0) return [10000, 20000, 50000, 100000];

  const denominations = [10000, 20000, 50000, 100000, 200000, 500000];
  const suggestions = new Set<number>();

  suggestions.add(grandTotal);

  const next10k = Math.ceil(grandTotal / 10000) * 10000;
  if (next10k > grandTotal) suggestions.add(next10k);

  const next50k = Math.ceil(grandTotal / 50000) * 50000;
  if (next50k > grandTotal) suggestions.add(next50k);

  const next100k = Math.ceil(grandTotal / 100000) * 100000;
  if (next100k > grandTotal) suggestions.add(next100k);

  for (const denom of denominations) {
    if (denom > grandTotal && suggestions.size < 6) {
      suggestions.add(denom);
    }
  }

  return Array.from(suggestions).sort((a, b) => a - b).slice(0, 6);
}
