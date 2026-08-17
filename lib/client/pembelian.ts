import { parseResponse } from "@/lib/client/apiResponse";
import type { Pembelian } from "@/lib/server/pembelian/types";

export async function fetchPembelianList(): Promise<Pembelian[]> {
  const response = await fetch("/api/pembelian", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Pembelian[] | undefined>(response)) ?? [];
}

export async function fetchPembelianByKode(kodebeli: string): Promise<Pembelian> {
  const response = await fetch(`/api/pembelian/${kodebeli}`, {
    headers: { Accept: "application/json" },
  });

  return parseResponse<Pembelian>(response);
}

export async function createPembelian(input: Pembelian): Promise<Pembelian> {
  const response = await fetch("/api/pembelian", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Pembelian>(response);
}

export async function updatePembelian(kodebeli: string, input: Pembelian): Promise<Pembelian> {
  const response = await fetch(`/api/pembelian/${kodebeli}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Pembelian>(response);
}
