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

/**
 * Daftar `idlokasi` dari query `idlokasi=1,2,3`. `null`/kosong = tak ada filter Lokasi
 * (semua Lokasi). Nilai bukan angka dibuang; hasil kosong setelah parse tetap dikembalikan
 * sebagai `[]` sehingga pemanggil bisa membedakan "semua" (undefined) dari "tak satu pun" (`[]`).
 */
export function parseIdlokasiQuery(value: string | null): number[] | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  return value
    .split(",")
    .map((bagian) => Number(bagian.trim()))
    .filter((angka) => Number.isInteger(angka) && angka > 0);
}
