import { parseResponse } from "@/lib/client/apiResponse";
import type { CreateKasInput, Kas, UpdateKasInput } from "@/lib/server/kas/types";

export type { Kas };

export async function fetchKasList(): Promise<Kas[]> {
  const response = await fetch("/api/transaksi/kas", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Kas[] | undefined>(response)) ?? [];
}

export async function fetchKasByKode(kodekas: string): Promise<Kas> {
  const response = await fetch(`/api/transaksi/kas/${kodekas}`, {
    headers: { Accept: "application/json" },
  });

  return parseResponse<Kas>(response);
}

export async function createKas(input: CreateKasInput): Promise<Kas> {
  const response = await fetch("/api/transaksi/kas", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Kas>(response);
}

export async function updateKas(kodekas: string, input: UpdateKasInput): Promise<Kas> {
  const response = await fetch(`/api/transaksi/kas/${kodekas}`, {
    method : "PATCH",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Kas>(response);
}

export async function cancelKas(kodekas: string, alasanbatal?: string): Promise<Kas> {
  const response = await fetch(`/api/transaksi/kas/${kodekas}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ alasanbatal }),
  });

  return parseResponse<Kas>(response);
}
