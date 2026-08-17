import { withComputedAmounts } from "@/lib/server/transaksi/calculations";
import type { PpnMode, TransaksiItem } from "@/lib/server/transaksi/types";
import type { Barang } from "@/lib/server/barang/types";

const emptyRow: TransaksiItem = {
  kodebarang: "",
  namabarang: "",
  satuan    : "",
  qty       : 1,
  harga     : 0,
  pakaiPpn  : "TIDAK",
  diskon    : 0,
  ppn       : 0,
  subtotal  : 0,
};

export function addEmptyRow(items: TransaksiItem[]): TransaksiItem[] {
  return [...items, { ...emptyRow }];
}

export function removeRow(items: TransaksiItem[], index: number): TransaksiItem[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function selectBarangForRow(
  items: TransaksiItem[],
  index: number,
  barang: Barang,
  priceField: "hargabeli" | "hargajual",
): TransaksiItem[] {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) return item;

    return withComputedAmounts({
      diskon    : 0,
      harga     : barang[priceField],
      kodebarang: barang.kodebarang,
      namabarang: barang.namabarang,
      pakaiPpn  : "TIDAK",
      qty       : 1,
      satuan    : barang.satuan,
    });
  });
}

export function updateRowField(
  items: TransaksiItem[],
  index: number,
  field: "diskon" | "harga" | "pakaiPpn" | "qty",
  value: PpnMode | number,
): TransaksiItem[] {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) return item;

    const next = { ...item, [field]: value };

    return withComputedAmounts(next);
  });
}
