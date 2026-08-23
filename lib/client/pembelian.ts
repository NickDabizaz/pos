import { parseResponse } from "@/lib/client/apiResponse";
import type { CreatePembelianInput, Pembelian } from "@/lib/server/pembelian/types";

export type { Pembelian };

export async function fetchPembelianList(): Promise<Pembelian[]> {
  const response = await fetch("/api/transaksi/pembelian", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Pembelian[] | undefined>(response)) ?? [];
}

export async function fetchPembelianByKode(kodebeli: string): Promise<Pembelian> {
  const response = await fetch(`/api/transaksi/pembelian/${kodebeli}`, {
    headers: { Accept: "application/json" },
  });

  return parseResponse<Pembelian>(response);
}

export async function createPembelian(input: CreatePembelianInput): Promise<Pembelian> {
  const response = await fetch("/api/transaksi/pembelian", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Pembelian>(response);
}

export async function cancelPembelian(kodebeli: string, alasanbatal?: string): Promise<Pembelian> {
  const response = await fetch(`/api/transaksi/pembelian/${kodebeli}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ alasanbatal }),
  });

  return parseResponse<Pembelian>(response);
}
