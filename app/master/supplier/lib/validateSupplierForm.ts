import type { Supplier, SupplierFormErrors } from "@/app/master/supplier/lib/types";

export function validateSupplierForm(values: Supplier): SupplierFormErrors {
  const errors: SupplierFormErrors = {};

  if (!values.namasupplier.trim()) {
    errors.namasupplier = "Nama supplier wajib diisi";
  }
  if (values.email.trim() && values.email !== "-" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Format email tidak valid";
  }

  return errors;
}
