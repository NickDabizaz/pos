const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** yyyy-mm-dd -> dd/mm/yyyy. Returns "" for an empty or unparseable input. */
export function isoToDisplay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/** dd/mm/yyyy (also accepts "-" or "." separators) -> yyyy-mm-dd, or null if not a real calendar date. */
export function displayToIso(display: string): string | null {
  const match = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(display.trim());
  if (!match) return null;

  const day   = Number(match[1]);
  const month = Number(match[2]);
  const year  = Number(match[3]);

  const date = new Date(year, month - 1, day);
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) return null;

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${monthNames[month]} ${year}`;
}

/** 42 calendar cells (6 weeks) covering the given month, padded with adjacent-month days. */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstOfMonth  = new Date(year, month, 1);
  const startWeekday  = firstOfMonth.getDay();
  const gridStart     = new Date(year, month, 1 - startWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export function toIsoDate(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
