import type { Lokasi, LokasiFormErrors } from "@/app/master/lokasi/lib/types";

export type ValidateLokasiFormOptions = {
  skipKodelokasi?: boolean;
};

export function validateLokasiForm(
  values: Lokasi,
  options: ValidateLokasiFormOptions = {},
): LokasiFormErrors {
  const errors: LokasiFormErrors = {};

  if (!options.skipKodelokasi && !values.kodelokasi.trim()) {
    errors.kodelokasi = "Kode lokasi wajib diisi";
  }
  if (!values.namalokasi.trim()) {
    errors.namalokasi = "Nama lokasi wajib diisi";
  }

  return errors;
}
