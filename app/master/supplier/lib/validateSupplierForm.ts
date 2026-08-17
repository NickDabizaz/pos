import type { Supplier, SupplierFormErrors } from "@/app/master/supplier/lib/types";

export type ValidateSupplierFormOptions = {
  skipKodesupplier?: boolean;
};

export function validateSupplierForm(
  values: Supplier,
  options: ValidateSupplierFormOptions = {},
): SupplierFormErrors {
  const errors: SupplierFormErrors = {};

  if (!options.skipKodesupplier && !values.kodesupplier.trim()) {
    errors.kodesupplier = "Kode supplier wajib diisi";
  }
  if (!values.namasupplier.trim()) {
    errors.namasupplier = "Nama supplier wajib diisi";
  }
  if (values.email.trim() && values.email !== "-" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Format email tidak valid";
  }

  return errors;
}
