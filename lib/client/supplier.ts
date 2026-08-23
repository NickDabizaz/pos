import { parseResponse } from "@/lib/client/apiResponse";
import type { Supplier } from "@/app/master/supplier/lib/types";

export type { Supplier };

function normalizeSupplier(supplier: Supplier): Supplier {
  return {
    ...supplier,
    kontakperson: supplier.kontakperson ?? "",
    telepon     : supplier.telepon ?? "",
    email       : supplier.email ?? "",
    alamat      : supplier.alamat ?? "",
  };
}

export async function fetchSupplierList(): Promise<Supplier[]> {
  const response = await fetch("/api/master/supplier", {
    headers: { Accept: "application/json" },
  });
  const data = (await parseResponse<Supplier[] | undefined>(response)) ?? [];

  return data.map(normalizeSupplier);
}

export async function createSupplier(
  input: Pick<Supplier, "namasupplier" | "kontakperson" | "telepon" | "email" | "alamat">,
): Promise<Supplier> {
  const response = await fetch("/api/master/supplier", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });
  const created = await parseResponse<Supplier>(response);

  return normalizeSupplier(created);
}

export async function updateSupplier(kodesupplier: string, input: Supplier): Promise<Supplier> {
  const response = await fetch(`/api/master/supplier/${kodesupplier}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });
  const updated = await parseResponse<Supplier>(response);

  return normalizeSupplier(updated);
}

export async function deleteSupplier(kodesupplier: string): Promise<void> {
  const response = await fetch(`/api/master/supplier/${kodesupplier}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
