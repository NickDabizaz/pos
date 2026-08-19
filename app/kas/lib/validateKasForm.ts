import type { Kas, KasFormErrors } from "@/app/kas/lib/types";

export function validateKasForm(values: Kas): KasFormErrors {
  const errors: KasFormErrors = {};

  if (!values.tanggal.trim()) {
    errors.tanggal = "Tanggal wajib diisi";
  }
  if (!values.kodelokasi.trim()) {
    errors.kodelokasi = "Lokasi wajib dipilih";
  }
  if (!values.nominal || values.nominal <= 0) {
    errors.nominal = "Nominal wajib diisi dan harus lebih dari 0";
  }
  if (!values.keterangan.trim()) {
    errors.keterangan = "Keterangan wajib diisi";
  }

  return errors;
}
