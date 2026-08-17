import {
  findAllCustomer,
  findCustomerByKode,
  insertCustomer,
  removeCustomer,
  replaceCustomer,
} from "@/lib/server/customer/repository";
import type { Customer } from "@/lib/server/customer/types";

export class DuplicateKodeError extends Error {}
export class CustomerNotFoundError extends Error {}

export function listCustomer(): Customer[] {
  return findAllCustomer();
}

export function generateKodeCustomer(): string {
  return `CUST-AUTO-${String(findAllCustomer().length + 1).padStart(4, "0")}`;
}

export function createCustomer(input: Customer): Customer {
  if (findCustomerByKode(input.kodecustomer)) {
    throw new DuplicateKodeError(`Kode customer ${input.kodecustomer} sudah digunakan`);
  }

  insertCustomer(input);
  return input;
}

export function updateCustomer(kodecustomer: string, input: Customer): Customer {
  if (!findCustomerByKode(kodecustomer)) {
    throw new CustomerNotFoundError(`Customer ${kodecustomer} tidak ditemukan`);
  }

  replaceCustomer(kodecustomer, input);
  return input;
}

export function deleteCustomer(kodecustomer: string): void {
  if (!findCustomerByKode(kodecustomer)) {
    throw new CustomerNotFoundError(`Customer ${kodecustomer} tidak ditemukan`);
  }

  removeCustomer(kodecustomer);
}
