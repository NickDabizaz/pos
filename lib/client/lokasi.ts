import { parseResponse } from "@/lib/client/apiResponse";
import type { Lokasi } from "@/lib/server/lokasi/types";

export async function fetchLokasiList(): Promise<Lokasi[]> {
  const response = await fetch("/api/master/lokasi", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Lokasi[] | undefined>(response)) ?? [];
}

export async function createLokasi(input: Lokasi & { autoGenerateKode?: boolean }): Promise<Lokasi> {
  const response = await fetch("/api/master/lokasi", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Lokasi>(response);
}

export async function updateLokasi(kodelokasi: string, input: Lokasi): Promise<Lokasi> {
  const response = await fetch(`/api/master/lokasi/${kodelokasi}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Lokasi>(response);
}

export async function deleteLokasi(kodelokasi: string): Promise<void> {
  const response = await fetch(`/api/master/lokasi/${kodelokasi}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
