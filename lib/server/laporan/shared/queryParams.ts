/** `YYYY-MM-DD` -> `Date` di tengah malam UTC, sehingga cocok dengan kolom `@db.Date`. */
export function parseTanggalQuery(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const cocok = /^\d{4}-\d{2}-\d{2}$/.exec(value);
  if (!cocok) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function parseFlagQuery(value: string | null): boolean {
  return value === "1" || value === "true";
}
