"use client";

import ComboGrid, { type ComboGridColumn } from "@/components/ComboGrid";
import Dropdown, { type DropdownOption } from "@/components/Dropdown";
import { formatRupiah } from "@/lib/format";
import type { Barang } from "@/lib/server/barang/types";
import type { PpnMode, TransaksiItem } from "@/lib/server/transaksi/types";

const pakaiPpnOptions: DropdownOption<PpnMode>[] = [
  { value: "TIDAK", label: "Tidak" },
  { value: "EXCLUDE", label: "Exclude" },
  { value: "INCLUDE", label: "Include" },
];

type ItemLineRowProps = {
  barangColumns : ComboGridColumn<Barang>[];
  barangList    : Barang[];
  item          : TransaksiItem;
  onRemoveAction: () => void;
  onSelectBarangAction: (barang: Barang) => void;
  onUpdateFieldAction : (field: "diskon" | "harga" | "pakaiPpn" | "qty", value: PpnMode | number) => void;
};

export default function ItemLineRow({
  barangColumns,
  barangList,
  item,
  onRemoveAction,
  onSelectBarangAction,
  onUpdateFieldAction,
}: ItemLineRowProps) {
  return (
    <tr className="align-top">
      <td className="min-w-64 px-2 py-2">
        {item.kodebarang ? (
          <div>
            <p className="text-sm font-medium text-foreground">{item.namabarang}</p>
            <p className="text-xs text-muted-foreground">{item.kodebarang} · {item.satuan}</p>
          </div>
        ) : (
          <ComboGrid
            columns        = {barangColumns}
            data           = {barangList}
            labelKey       = "namabarang"
            onChangeAction = {(_value, row) => {
              if (row) onSelectBarangAction(row);
            }}
            placeholder    = "Cari nama, kode, atau barcode barang..."
            searchKeys     = {["namabarang", "kodebarang", "barcode"]}
            valueKey       = "kodebarang"
          />
        )}
      </td>
      <td className="w-20 px-2 py-2">
        <input
          className="w-full rounded-lg border border-border bg-background px-2 py-1 text-right text-sm text-foreground"
          disabled={!item.kodebarang}
          min={1}
          onChange={(event) => onUpdateFieldAction("qty", Number(event.target.value) || 0)}
          type="number"
          value={item.qty}
        />
      </td>
      <td className="w-32 px-2 py-2">
        <input
          className="w-full rounded-lg border border-border bg-background px-2 py-1 text-right text-sm text-foreground"
          disabled={!item.kodebarang}
          min={0}
          onChange={(event) => onUpdateFieldAction("harga", Number(event.target.value) || 0)}
          type="number"
          value={item.harga}
        />
      </td>
      <td className="w-32 px-2 py-2">
        <Dropdown
          disabled       = {!item.kodebarang}
          onChangeAction = {(value) => onUpdateFieldAction("pakaiPpn", value)}
          options        = {pakaiPpnOptions}
          value          = {item.pakaiPpn}
        />
      </td>
      <td className="w-28 px-2 py-2 text-right text-sm text-muted-foreground">
        {formatRupiah(item.ppn)}
      </td>
      <td className="w-28 px-2 py-2">
        <input
          className="w-full rounded-lg border border-border bg-background px-2 py-1 text-right text-sm text-foreground"
          disabled={!item.kodebarang}
          min={0}
          onChange={(event) => onUpdateFieldAction("diskon", Number(event.target.value) || 0)}
          type="number"
          value={item.diskon}
        />
      </td>
      <td className="w-32 px-2 py-2 text-right text-sm font-medium text-foreground">
        {formatRupiah(item.subtotal)}
      </td>
      <td className="w-10 px-2 py-2 text-right">
        <button
          aria-label="Hapus baris"
          className="rounded-md p-1.5 text-muted-foreground/70 transition-colors hover:bg-status-danger-bg hover:text-status-danger-fg"
          onClick={onRemoveAction}
          type="button"
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
