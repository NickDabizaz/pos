import { parseResponse } from "@/lib/client/apiResponse";
import type { Supplier } from "@/lib/server/supplier/types";

export async function fetchSupplierList(): Promise<Supplier[]> {
  const response = await fetch("/api/master/supplier", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Supplier[] | undefined>(response)) ?? [];
}

export async function createSupplier(input: Supplier & { autoGenerateKode?: boolean }): Promise<Supplier> {
  const response = await fetch("/api/master/supplier", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Supplier>(response);
}

export async function updateSupplier(kodesupplier: string, input: Supplier): Promise<Supplier> {
  const response = await fetch(`/api/master/supplier/${kodesupplier}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Supplier>(response);
}

export async function deleteSupplier(kodesupplier: string): Promise<void> {
  const response = await fetch(`/api/master/supplier/${kodesupplier}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
