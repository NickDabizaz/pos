"use client";

import ItemLineRow from "@/components/ItemLinesTable/components/ItemLineRow";
import { addEmptyRow, removeRow, selectBarangForRow, updateRowField } from "@/components/ItemLinesTable/lib/itemLines";
import type { ItemLinesTableProps } from "@/components/ItemLinesTable/lib/types";
import type { ComboGridColumn } from "@/components/ComboGrid";
import type { Barang } from "@/lib/server/barang/types";

export type { ItemLinesTableProps } from "@/components/ItemLinesTable/lib/types";

export default function ItemLinesTable({
  barangList,
  items,
  onChangeAction,
  priceField,
  priceLabel,
}: ItemLinesTableProps) {
  const barangColumns: ComboGridColumn<Barang>[] = [
    { key: "kodebarang", label: "Kode", width: "120px" },
    { key: "namabarang", label: "Nama Barang", width: "220px" },
    { key: "satuan", label: "Satuan", width: "100px" },
    { key: priceField, label: priceLabel, format: "currency", align: "right", width: "140px" },
  ];

  const availableBarang = barangList.filter((barang) => barang.status === 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-border">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-secondary/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="min-w-64 px-2 py-2 text-left">Barang</th>
              <th className="w-20 px-2 py-2 text-right">Qty</th>
              <th className="w-32 px-2 py-2 text-right">{priceLabel} (Rp)</th>
              <th className="w-32 px-2 py-2 text-left">Pakai PPN</th>
              <th className="w-28 px-2 py-2 text-right">PPN</th>
              <th className="w-28 px-2 py-2 text-right">Diskon (Rp)</th>
              <th className="w-32 px-2 py-2 text-right">Subtotal</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-muted-foreground" colSpan={8}>
                  Belum ada baris barang. Klik &quot;Tambah Baris&quot; untuk mulai.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <ItemLineRow
                  barangColumns        = {barangColumns}
                  barangList           = {availableBarang}
                  item                 = {item}
                  key                  = {index}
                  onRemoveAction       = {() => onChangeAction(removeRow(items, index))}
                  onSelectBarangAction = {(barang) => onChangeAction(selectBarangForRow(items, index, barang, priceField))}
                  onUpdateFieldAction  = {(field, value) => onChangeAction(updateRowField(items, index, field, value))}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        className="self-start rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        onClick={() => onChangeAction(addEmptyRow(items))}
        type="button"
      >
        + Tambah Baris
      </button>
    </div>
  );
}
