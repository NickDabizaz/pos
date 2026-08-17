# Dropdown module

`Dropdown` is the global module for a single-select choice from a short,
known list of options (e.g. status, mode, category). Use and extend this
module instead of a page-specific `<select>` or custom popup, so every
dropdown in the app shares the same look and keyboard/outside-click
behavior.

Not a fit for picking one row out of a large or searchable dataset — use
`ComboGrid` for that instead.

## Public interface

```tsx
import Dropdown, { type DropdownOption } from "@/components/Dropdown";

const options: DropdownOption<"TIDAK" | "EXCLUDE" | "INCLUDE">[] = [
  { value: "TIDAK", label: "Tidak Pakai PPN" },
  { value: "EXCLUDE", label: "Exclude PPN" },
  { value: "INCLUDE", label: "Include PPN" },
];

<Dropdown
  label          = "Pakai PPN"
  onChangeAction = {(value) => setPakaiPpn(value)}
  options        = {options}
  value          = {pakaiPpn}
/>
```

- `options` is a plain array of `{ value, label }` — no async loading, no
  search box. Keep the list short (a handful of choices); anything long or
  searchable belongs in `ComboGrid`.
- `onChangeAction` fires with the selected option's `value`; there is no
  "clear" state — a `Dropdown` always resolves to one of `options`.
- Callback props are suffixed `Action` because this is a `"use client"`
  entry component; Next.js requires non-Server-Action function props on
  such boundaries to be named that way.

## Structure and ownership

```text
Dropdown/
├── index.tsx
├── AGENTS.md
└── lib/
    └── types.ts
```

- `index.tsx` owns the public interface and all rendering.
- `lib/types.ts` owns `DropdownOption`/`DropdownProps`.
- Keep property `:`/`=` characters vertically aligned within adjacent
  declarations, objects, and JSX props.

## Verification

After changing this module, run:

```text
npx tsc --noEmit
npm run lint
npm run build
```
