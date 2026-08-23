import type { Lokasi, LokasiFormErrors } from "@/app/master/lokasi/lib/types";

export function validateLokasiForm(values: Lokasi): LokasiFormErrors {
  const errors: LokasiFormErrors = {};

  if (!values.namalokasi.trim()) {
    errors.namalokasi = "Nama lokasi wajib diisi";
  }

  return errors;
}
