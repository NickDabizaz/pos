import type { Penjualan, PenjualanFormErrors } from "@/app/penjualan/lib/types";

export function validatePenjualanForm(values: Penjualan): PenjualanFormErrors {
  const errors: PenjualanFormErrors = {};

  if (!values.tanggal.trim()) {
    errors.tanggal = "Tanggal wajib diisi";
  }
  if (!values.kodecustomer.trim()) {
    errors.kodecustomer = "Customer wajib dipilih";
  }
  if (values.items.length === 0) {
    errors.items = "Minimal 1 barang harus ditambahkan";
  } else if (values.items.some((item) => !item.kodebarang.trim())) {
    errors.items = "Setiap baris harus memilih barang";
  }

  return errors;
}
