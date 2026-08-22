import type { PpnMode, TransaksiItem } from "@/lib/server/transaksi/types";

export const PPN_RATE = 0.11;

export function calculateLinePpn(qty: number, harga: number, diskon: number, pakaiPpn: PpnMode): number {
  const base = qty * harga - diskon;

  if (pakaiPpn === "EXCLUDE") {
    const ppn = base * PPN_RATE;

    return ppn;
  }

  if (pakaiPpn === "INCLUDE") {
    const ppn = (base * PPN_RATE) / (1 + PPN_RATE);

    return ppn;
  }

  return 0;
}

export function calculateLineSubtotal(qty: number, harga: number, diskon: number, pakaiPpn: PpnMode): number {
  const base = qty * harga - diskon;

  if (pakaiPpn === "EXCLUDE") {
    const subtotal = base + calculateLinePpn(qty, harga, diskon, pakaiPpn);

    return subtotal;
  }

  return base;
}

export type TransaksiItemInput = Pick<TransaksiItem, "diskon" | "harga" | "kodebarang" | "namabarang" | "pakaiPpn" | "qty" | "satuan">;

export function withComputedAmounts(input: TransaksiItemInput): TransaksiItem {
  const { diskon, harga, pakaiPpn, qty } = input;

  return {
    ...input,
    ppn     : calculateLinePpn(qty, harga, diskon, pakaiPpn),
    subtotal: calculateLineSubtotal(qty, harga, diskon, pakaiPpn),
  };
}

export type HeaderTotals = {
  diskon    : number;
  grandtotal: number;
  ppn       : number;
  total     : number;
};

export function calculateHeaderTotals(items: TransaksiItem[]): HeaderTotals {
  const total  = items.reduce((acc, item) => acc + item.qty * item.harga, 0);
  const diskon = items.reduce((acc, item) => acc + item.diskon, 0);
  const ppn    = items.reduce((acc, item) => acc + item.ppn, 0);

  return {
    diskon,
    grandtotal: total - diskon + ppn,
    ppn,
    total,
  };
}
