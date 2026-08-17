import type { Customer, CustomerFormErrors } from "@/app/master/customer/lib/types";

export type ValidateCustomerFormOptions = {
  skipKodecustomer?: boolean;
};

export function validateCustomerForm(
  values: Customer,
  options: ValidateCustomerFormOptions = {},
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};

  if (!options.skipKodecustomer && !values.kodecustomer.trim()) {
    errors.kodecustomer = "Kode customer wajib diisi";
  }
  if (!values.namacustomer.trim()) {
    errors.namacustomer = "Nama customer wajib diisi";
  }
  if (values.email.trim() && values.email !== "-" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Format email tidak valid";
  }

  return errors;
}
