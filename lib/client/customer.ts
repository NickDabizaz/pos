import { parseResponse } from "@/lib/client/apiResponse";
import type { Customer } from "@/lib/server/customer/types";

export async function fetchCustomerList(): Promise<Customer[]> {
  const response = await fetch("/api/master/customer", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Customer[] | undefined>(response)) ?? [];
}

export async function createCustomer(input: Customer & { autoGenerateKode?: boolean }): Promise<Customer> {
  const response = await fetch("/api/master/customer", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Customer>(response);
}

export async function updateCustomer(kodecustomer: string, input: Customer): Promise<Customer> {
  const response = await fetch(`/api/master/customer/${kodecustomer}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Customer>(response);
}

export async function deleteCustomer(kodecustomer: string): Promise<void> {
  const response = await fetch(`/api/master/customer/${kodecustomer}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
