# ItemLinesTable module

`ItemLinesTable` is the global module for editing a transaction's line
items (barang + qty + harga + PPN + diskon + subtotal) — used by both the
Penjualan and Pembelian forms, which need the identical row shape and only
differ in which `Barang` price field defaults into a new row. Use and
extend this module instead of building a page-specific item-lines table.

## Public interface

```tsx
import ItemLinesTable from "@/components/ItemLinesTable";

<ItemLinesTable
  barangList     = {barangList}
  items          = {items}
  onChangeAction = {setItems}
  priceField     = "hargajual"
  priceLabel     = "Harga Jual"
/>
```

- `items`/`onChangeAction` is a single controlled `TransaksiItem[]` pair —
  the caller owns the state, this module only computes the next array and
  hands it back. There is no internal item state.
- `priceField` (`"hargajual"` | `"hargabeli"`) selects which `Barang` field
  seeds a new row's price once a barang is picked; `priceLabel` is the
  matching column header (e.g. `"Harga Jual"` / `"Harga Beli"`).
- Rows are added blank via "+ Tambah Baris" *first*; the barang picker
  (`ComboGrid`) lives inside the row itself and only appears until a barang
  is chosen for that row — after that the row shows the picked barang's
  name/kode/satuan as text. This mirrors how the row-first entry flow was
  requested: pick "add a row," then fill it, rather than picking a barang
  from a picker that lives outside the table.
- Once a barang is picked, `qty` defaults to `1` and `harga` defaults from
  `barang[priceField]` — both stay editable afterward (manual price/qty
  negotiation is expected). `pakaiPpn` defaults to `"TIDAK"`; `diskon`
  defaults to `0`.
- `ppn` and `subtotal` are always derived, never directly editable — see
  `lib/server/transaksi/calculations.ts` (`withComputedAmounts`) for the
  PPN math (`TIDAK` = no tax, `EXCLUDE` = tax added on top of `harga`,
  `INCLUDE` = tax embedded in `harga`).
- Rows are keyed by array index (not `kodebarang`), because a blank,
  not-yet-picked row has no `kodebarang` and more than one can exist at
  once. Picking the same barang into two different rows is allowed —
  merging would fight the explicit "one row per pick" flow this module
  implements.
- Callback props are suffixed `Action` because this is a `"use client"`
  entry component; Next.js requires non-Server-Action function props on
  such boundaries to be named that way.

## Structure and ownership

```text
ItemLinesTable/
├── index.tsx
├── AGENTS.md
├── components/
│   └── ItemLineRow.tsx
└── lib/
    ├── itemLines.ts
    ├── types.ts
    └── __tests__/
        └── itemLines.test.ts
```

- `index.tsx` owns the public interface, the table shell, and the "Tambah
  Baris" action.
- `components/ItemLineRow.tsx` owns one row's rendering — the in-row
  `ComboGrid` picker, qty/harga/diskon inputs, the `pakaiPpn` `Dropdown`,
  and the readonly ppn/subtotal cells.
- `lib/itemLines.ts` owns the pure row-array transformations
  (`addEmptyRow`, `removeRow`, `selectBarangForRow`, `updateRowField`) —
  no React state lives here, which is why the file isn't named as a hook;
  the caller holds the `items` state and this module only computes the
  next array.
- `lib/types.ts` owns `ItemLinesTableProps`.
- Amount math (PPN, subtotal, header totals) lives in
  `lib/server/transaksi/calculations.ts`, not here — both Penjualan and
  Pembelian need the same math for their header totals, so it's shared at
  the domain-type level rather than duplicated per UI module.
- Keep property `:`/`=` characters vertically aligned within adjacent
  declarations, objects, and JSX props.

## Verification

After changing this module, run:

```text
npx tsc --noEmit
npm run lint
npm run build
npx vitest run components/ItemLinesTable
```
