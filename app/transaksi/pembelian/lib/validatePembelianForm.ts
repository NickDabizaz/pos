import type { PembelianFormErrors, PembelianFormValues } from "@/app/transaksi/pembelian/lib/types";

export function validatePembelianForm(values: PembelianFormValues): PembelianFormErrors {
  const errors: PembelianFormErrors = {};

  if (!values.tanggal.trim()) {
    errors.tanggal = "Tanggal wajib diisi";
  }
  if (!values.kodesupplier.trim()) {
    errors.kodesupplier = "Supplier wajib dipilih";
  }
  if (!values.kodelokasi.trim()) {
    errors.kodelokasi = "Lokasi wajib dipilih";
  }
  if (values.items.length === 0) {
    errors.items = "Minimal 1 barang harus ditambahkan";
  } else if (values.items.some((item) => !item.kodebarang.trim())) {
    errors.items = "Setiap baris harus memilih barang";
  }

  return errors;
}
