import { parseResponse } from "@/lib/client/apiResponse";
import type { Penjualan } from "@/lib/server/penjualan/types";

export async function fetchPenjualanList(): Promise<Penjualan[]> {
  const response = await fetch("/api/penjualan", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Penjualan[] | undefined>(response)) ?? [];
}

export async function fetchPenjualanByKode(kodejual: string): Promise<Penjualan> {
  const response = await fetch(`/api/penjualan/${kodejual}`, {
    headers: { Accept: "application/json" },
  });

  return parseResponse<Penjualan>(response);
}

export async function createPenjualan(input: Penjualan): Promise<Penjualan> {
  const response = await fetch("/api/penjualan", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Penjualan>(response);
}

export async function updatePenjualan(kodejual: string, input: Penjualan): Promise<Penjualan> {
  const response = await fetch(`/api/penjualan/${kodejual}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Penjualan>(response);
}
