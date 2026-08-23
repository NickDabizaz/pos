import type { Customer, CustomerFormErrors } from "@/app/master/customer/lib/types";

export function validateCustomerForm(values: Customer): CustomerFormErrors {
  const errors: CustomerFormErrors = {};

  if (!values.namacustomer.trim()) {
    errors.namacustomer = "Nama customer wajib diisi";
  }
  if (values.email.trim() && values.email !== "-" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Format email tidak valid";
  }

  return errors;
}
