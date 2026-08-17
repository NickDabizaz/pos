import type { PpnMode, StatusTransaksi, TransaksiItem } from "@/lib/server/transaksi/types";

const ppnModes: PpnMode[] = ["TIDAK", "EXCLUDE", "INCLUDE"];

export function parseTransaksiItems(rawItems: unknown): TransaksiItem[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((item) => ({
    kodebarang: String(item.kodebarang ?? ""),
    namabarang: String(item.namabarang ?? ""),
    satuan    : String(item.satuan ?? ""),
    qty       : Number(item.qty) || 0,
    harga     : Number(item.harga) || 0,
    pakaiPpn  : ppnModes.includes(item.pakaiPpn) ? (item.pakaiPpn as PpnMode) : "TIDAK",
    diskon    : Number(item.diskon) || 0,
    ppn       : Number(item.ppn) || 0,
    subtotal  : Number(item.subtotal) || 0,
  }));
}

export function parseStatusTransaksi(value: unknown): StatusTransaksi {
  return value === "D" ? "D" : "S";
}
