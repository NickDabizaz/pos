import { useCallback, useMemo, useState } from "react";

import { calculateGrandTotal, calculateSubtotal } from "@/app/pos/lib/calculations";
import type { Barang, CartItem } from "@/app/pos/lib/types";

export function usePosCart() {
  const [items, setItems]       = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [orderNote, setOrderNote] = useState<string>("");

  const subtotal = useMemo(() => calculateSubtotal(items), [items]);
  const grandTotal = useMemo(() => calculateGrandTotal(subtotal, discount), [subtotal, discount]);
  const totalQty = useMemo(() => items.reduce((acc, item) => acc + item.qty, 0), [items]);

  const addItem = useCallback((barang: Barang, qty = 1) => {
    if (qty <= 0) return;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.barang.kodebarang === barang.kodebarang);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          qty: next[existingIndex].qty + qty,
        };
        return next;
      }
      return [...prev, { barang, qty }];
    });
  }, []);

  const updateQty = useCallback((kodebarang: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) {
        return prev.filter((item) => item.barang.kodebarang !== kodebarang);
      }
      return prev.map((item) =>
        item.barang.kodebarang === kodebarang ? { ...item, qty } : item,
      );
    });
  }, []);

  const updateItemNote = useCallback((kodebarang: string, note: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.barang.kodebarang === kodebarang ? { ...item, note } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((kodebarang: string) => {
    setItems((prev) => prev.filter((item) => item.barang.kodebarang !== kodebarang));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setOrderNote("");
  }, []);

  return {
    addItem,
    clearCart,
    discount,
    grandTotal,
    items,
    orderNote,
    removeItem,
    setDiscount,
    setOrderNote,
    subtotal,
    totalQty,
    updateItemNote,
    updateQty,
  };
}
