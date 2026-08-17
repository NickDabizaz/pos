# DatePicker module

`DatePicker` is the global module for picking a single calendar date. It
combines a typeable text field (`dd/mm/yyyy`) with a click-to-open calendar
popup, so a user can either type a date directly or pick one visually. Use
and extend this module instead of a native `<input type="date">` or a
page-specific calendar popup.

## Public interface

```tsx
import DatePicker from "@/components/DatePicker";

<DatePicker
  label          = "Tanggal"
  onChangeAction = {(isoDate) => setTanggal(isoDate)}
  value          = {tanggal}
/>
```

- `value`/`onChangeAction` always carry an ISO `yyyy-mm-dd` string — the same
  shape a native date input produces — so it drops into existing form state
  without conversion.
- The text field accepts typed input in `dd/mm/yyyy` (also tolerant of `-`
  and `.` separators). It only commits on blur or Enter, and only if the
  typed text parses to a real calendar date (see
  `lib/dateFormat.ts:displayToIso`); otherwise it snaps back to the last
  valid `value`.
- Picking a day in the calendar popup commits immediately and closes the
  popup.
- Callback props are suffixed `Action` because this is a `"use client"`
  entry component; Next.js requires non-Server-Action function props on
  such boundaries to be named that way.

## Structure and ownership

```text
DatePicker/
├── index.tsx
├── AGENTS.md
├── components/
│   └── DatePickerCalendar.tsx
└── lib/
    ├── dateFormat.ts
    ├── types.ts
    └── __tests__/
        └── dateFormat.test.ts
```

- `index.tsx` owns the public interface, the typeable input, and popup
  open/close/outside-click behavior.
- `components/DatePickerCalendar.tsx` owns the month-grid rendering and
  month navigation; it is presentation-only (controlled by `index.tsx`).
- `lib/dateFormat.ts` owns all date parsing/formatting — ISO ↔ display
  conversion and calendar-grid generation — kept dependency-free and
  unit-tested so date-math bugs surface without mounting the component.
- Keep property `:`/`=` characters vertically aligned within adjacent
  declarations, objects, and JSX props.

## Verification

After changing this module, run:

```text
npx tsc --noEmit
npm run lint
npm run build
npx vitest run components/DatePicker
```
