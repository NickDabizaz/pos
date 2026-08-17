import type { Customer } from "@/lib/server/customer/types";

export type { Customer };

export type CustomerFormErrors = {
  kodecustomer?: string;
  namacustomer?: string;
  telepon     ?: string;
  email       ?: string;
  alamat      ?: string;
};
