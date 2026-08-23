import type { PpnMode, TransaksiItem } from "@/lib/server/transaksi/types";

export const PPN_RATE = 0.11;

export function calculateLinePpn(qty: number, harga: number, diskon: number, pakaiPpn: PpnMode, ppnRate: number = PPN_RATE): number {
  const base = qty * harga - diskon;

  if (pakaiPpn === "EXCLUDE") {
    const ppn = base * ppnRate;

    return ppn;
  }

  if (pakaiPpn === "INCLUDE") {
    const ppn = (base * ppnRate) / (1 + ppnRate);

    return ppn;
  }

  return 0;
}

export function calculateLineSubtotal(qty: number, harga: number, diskon: number, pakaiPpn: PpnMode, ppnRate: number = PPN_RATE): number {
  const base = qty * harga - diskon;

  if (pakaiPpn === "EXCLUDE") {
    const subtotal = base + calculateLinePpn(qty, harga, diskon, pakaiPpn, ppnRate);

    return subtotal;
  }

  return base;
}

export type TransaksiItemInput = Pick<TransaksiItem, "diskon" | "harga" | "kodebarang" | "namabarang" | "pakaiPpn" | "qty" | "satuan">;

export function withComputedAmounts(input: TransaksiItemInput, ppnRate: number = PPN_RATE): TransaksiItem {
  const { diskon, harga, pakaiPpn, qty } = input;

  return {
    ...input,
    ppn     : calculateLinePpn(qty, harga, diskon, pakaiPpn, ppnRate),
    subtotal: calculateLineSubtotal(qty, harga, diskon, pakaiPpn, ppnRate),
  };
}

export type HeaderTotals = {
  diskon    : number;
  grandtotal: number;
  ppn       : number;
  total     : number;
};

export function calculateHeaderTotals(items: TransaksiItem[]): HeaderTotals {
  const total      = items.reduce((acc, item) => acc + item.qty * item.harga, 0);
  const diskon     = items.reduce((acc, item) => acc + item.diskon, 0);
  const ppn        = items.reduce((acc, item) => acc + item.ppn, 0);
  const grandtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

  return {
    diskon,
    grandtotal,
    ppn,
    total,
  };
}
