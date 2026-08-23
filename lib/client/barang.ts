import { parseResponse } from "@/lib/client/apiResponse";
import type { Barang } from "@/app/master/barang/lib/types";

export type { Barang };

function normalizeBarang(barang: Barang): Barang {
  return { ...barang, barcode: barang.barcode ?? "" };
}

export async function fetchBarangList(): Promise<Barang[]> {
  const response = await fetch("/api/master/barang", {
    headers: { Accept: "application/json" },
  });
  const data = (await parseResponse<Barang[] | undefined>(response)) ?? [];

  return data.map(normalizeBarang);
}

export async function createBarang(
  input: Pick<Barang, "namabarang" | "barcode" | "satuan" | "hargabeli" | "hargajual" | "pakaistok">,
): Promise<Barang> {
  const response = await fetch("/api/master/barang", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });
  const created = await parseResponse<Barang>(response);

  return normalizeBarang(created);
}

export async function updateBarang(kodebarang: string, input: Barang): Promise<Barang> {
  const response = await fetch(`/api/master/barang/${kodebarang}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });
  const updated = await parseResponse<Barang>(response);

  return normalizeBarang(updated);
}

export async function deleteBarang(kodebarang: string): Promise<void> {
  const response = await fetch(`/api/master/barang/${kodebarang}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
