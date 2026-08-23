import { parseResponse } from "@/lib/client/apiResponse";
import type { Lokasi } from "@/app/master/lokasi/lib/types";

export type { Lokasi };

function normalizeLokasi(lokasi: Lokasi): Lokasi {
  return { ...lokasi, keterangan: lokasi.keterangan ?? "" };
}

export async function fetchLokasiList(): Promise<Lokasi[]> {
  const response = await fetch("/api/master/lokasi", {
    headers: { Accept: "application/json" },
  });
  const data = (await parseResponse<Lokasi[] | undefined>(response)) ?? [];

  return data.map(normalizeLokasi);
}

export async function createLokasi(input: Pick<Lokasi, "namalokasi" | "keterangan">): Promise<Lokasi> {
  const response = await fetch("/api/master/lokasi", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });
  const created = await parseResponse<Lokasi>(response);

  return normalizeLokasi(created);
}

export async function updateLokasi(kodelokasi: string, input: Lokasi): Promise<Lokasi> {
  const response = await fetch(`/api/master/lokasi/${kodelokasi}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });
  const updated = await parseResponse<Lokasi>(response);

  return normalizeLokasi(updated);
}

export async function deleteLokasi(kodelokasi: string): Promise<void> {
  const response = await fetch(`/api/master/lokasi/${kodelokasi}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
