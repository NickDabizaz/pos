import { parseResponse } from "@/lib/client/apiResponse";
import type { CreatePenjualanInput, Penjualan, UpdatePenjualanInput } from "@/lib/server/penjualan/types";

export type { Penjualan };

export async function fetchPenjualanList(): Promise<Penjualan[]> {
  const response = await fetch("/api/transaksi/penjualan", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Penjualan[] | undefined>(response)) ?? [];
}

export async function fetchPenjualanByKode(kodejual: string): Promise<Penjualan> {
  const response = await fetch(`/api/transaksi/penjualan/${kodejual}`, {
    headers: { Accept: "application/json" },
  });

  return parseResponse<Penjualan>(response);
}

export async function createPenjualan(input: CreatePenjualanInput): Promise<Penjualan> {
  const response = await fetch("/api/transaksi/penjualan", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Penjualan>(response);
}

export async function updatePenjualan(kodejual: string, input: UpdatePenjualanInput): Promise<Penjualan> {
  const response = await fetch(`/api/transaksi/penjualan/${kodejual}`, {
    method : "PATCH",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Penjualan>(response);
}

export async function cancelPenjualan(kodejual: string, alasanbatal?: string): Promise<Penjualan> {
  const response = await fetch(`/api/transaksi/penjualan/${kodejual}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ alasanbatal }),
  });

  return parseResponse<Penjualan>(response);
}
