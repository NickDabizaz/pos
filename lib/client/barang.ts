import type { Barang } from "@/lib/server/barang/types";

type ApiResponse<T> = {
  data   ?: T;
  message : string;
};

export async function fetchBarangList(): Promise<Barang[]> {
  const response = await fetch("/api/master/barang", {
    headers: { Accept: "application/json" },
  });
  const json: ApiResponse<Barang[]> = await response.json();

  if (!response.ok) {
    throw new Error(json.message);
  }

  return json.data ?? [];
}
