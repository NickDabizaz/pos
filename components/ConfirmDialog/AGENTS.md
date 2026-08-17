# ConfirmDialog module

`ConfirmDialog` is the global module for confirming a destructive or
consequential action before it runs. Use and extend this module instead of
building a page-specific confirm popup.

## Public interface

```tsx
import ConfirmDialog from "@/components/ConfirmDialog";
```

```tsx
<ConfirmDialog
  title          = "Hapus Barang"
  description    = {`Apakah Anda yakin ingin menghapus ${item.namabarang}?`}
  isConfirming   = {isDeleting}
  onCancelAction = {() => setIsConfirming(false)}
  onConfirmAction= {() => doDelete()}
/>
```

- `alasan` (default `false`) — set `true` to require a reason before confirming
  (e.g. voiding a transaction). When `true`, `onConfirmAction` receives the
  trimmed reason text; when `false`, it receives `undefined`. Master-data
  confirmations (delete a barang, kategori, etc.) should leave this `false`.
- Callback props are suffixed `Action` (`onCancelAction`, `onConfirmAction`)
  because this is a `"use client"` entry component; Next.js requires
  non-Server-Action function props on such boundaries to be named that way.
- `tone` (default `"danger"`) — `"danger"` renders a solid red confirm button;
  `"neutral"` renders the primary button color. Use `"neutral"` for
  confirmations that aren't destructive.
- `confirmLabel`/`cancelLabel` default to `"Konfirmasi"`/`"Batal"` — override
  per call site (e.g. `"Hapus"`).
- The confirm button is disabled while `isConfirming` is `true`, and also
  while `alasan` is `true` and the reason field is empty.

## Structure and ownership

```text
ConfirmDialog/
├── index.tsx
├── AGENTS.md
└── lib/
    └── types.ts
```

- `index.tsx` owns the public interface and all rendering; the module has no
  internal sub-components yet — add `components/` only once a variant needs
  one.
- `lib/types.ts` owns the prop types.
- Keep property `:` characters vertically aligned within adjacent
  declarations and objects.

## Verification

After changing this module, run:

```text
npx tsc --noEmit
npm run lint
npm run build
```
