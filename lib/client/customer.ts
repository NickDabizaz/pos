import { parseResponse } from "@/lib/client/apiResponse";
import type { Customer } from "@/app/master/customer/lib/types";

export type { Customer };

function normalizeCustomer(customer: Customer): Customer {
  return {
    ...customer,
    telepon: customer.telepon ?? "",
    email  : customer.email ?? "",
    alamat : customer.alamat ?? "",
  };
}

export async function fetchCustomerList(): Promise<Customer[]> {
  const response = await fetch("/api/master/customer", {
    headers: { Accept: "application/json" },
  });
  const data = (await parseResponse<Customer[] | undefined>(response)) ?? [];

  return data.map(normalizeCustomer);
}

export async function createCustomer(
  input: Pick<Customer, "namacustomer" | "telepon" | "email" | "alamat">,
): Promise<Customer> {
  const response = await fetch("/api/master/customer", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });
  const created = await parseResponse<Customer>(response);

  return normalizeCustomer(created);
}

export async function updateCustomer(kodecustomer: string, input: Customer): Promise<Customer> {
  const response = await fetch(`/api/master/customer/${kodecustomer}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });
  const updated = await parseResponse<Customer>(response);

  return normalizeCustomer(updated);
}

export async function deleteCustomer(kodecustomer: string): Promise<void> {
  const response = await fetch(`/api/master/customer/${kodecustomer}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
