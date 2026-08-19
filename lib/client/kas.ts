import { parseResponse } from "@/lib/client/apiResponse";
import type { Kas } from "@/lib/server/kas/types";

export async function fetchKasList(): Promise<Kas[]> {
  const response = await fetch("/api/kas", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Kas[] | undefined>(response)) ?? [];
}

export async function fetchKasByKode(kodekas: string): Promise<Kas> {
  const response = await fetch(`/api/kas/${kodekas}`, {
    headers: { Accept: "application/json" },
  });

  return parseResponse<Kas>(response);
}

export async function createKas(input: Kas): Promise<Kas> {
  const response = await fetch("/api/kas", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Kas>(response);
}

export async function updateKas(kodekas: string, input: Kas): Promise<Kas> {
  const response = await fetch(`/api/kas/${kodekas}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Kas>(response);
}
