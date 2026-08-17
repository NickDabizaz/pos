import type { Supplier } from "@/lib/server/supplier/types";

export type { Supplier };

export type SupplierFormErrors = {
  kodesupplier?: string;
  namasupplier?: string;
  kontakPerson?: string;
  telepon     ?: string;
  email       ?: string;
  alamat      ?: string;
};
