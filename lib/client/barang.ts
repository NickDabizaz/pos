import { parseResponse } from "@/lib/client/apiResponse";
import type { Barang } from "@/lib/server/barang/types";

export async function fetchBarangList(): Promise<Barang[]> {
  const response = await fetch("/api/master/barang", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Barang[] | undefined>(response)) ?? [];
}

export async function createBarang(input: Barang & { autoGenerateKode?: boolean }): Promise<Barang> {
  const response = await fetch("/api/master/barang", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Barang>(response);
}

export async function updateBarang(kodebarang: string, input: Barang): Promise<Barang> {
  const response = await fetch(`/api/master/barang/${kodebarang}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Barang>(response);
}

export async function deleteBarang(kodebarang: string): Promise<void> {
  const response = await fetch(`/api/master/barang/${kodebarang}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
