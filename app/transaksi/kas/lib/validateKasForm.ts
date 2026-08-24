import type { KasFormErrors, KasFormValues } from "@/app/transaksi/kas/lib/types";

export function validateKasForm(values: KasFormValues): KasFormErrors {
  const errors: KasFormErrors = {};

  if (!values.tanggal.trim()) {
    errors.tanggal = "Tanggal wajib diisi";
  }
  if (!values.kodelokasi.trim()) {
    errors.kodelokasi = "Lokasi wajib dipilih";
  }
  if (values.rincian.length === 0) {
    errors.rincian = "Minimal 1 baris rincian harus ditambahkan";
  } else if (values.rincian.some((item) => !item.keterangan.trim() || !(item.nominal > 0))) {
    errors.rincian = "Setiap baris rincian harus punya keterangan dan nominal lebih dari nol";
  }

  return errors;
}
