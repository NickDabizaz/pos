import { parseResponse } from "@/lib/client/apiResponse";
import type { ConfigRow, KelompokConfig, Tema } from "@/app/pengaturan/lib/types";

export type { ConfigRow, KelompokConfig, Tema };

export async function fetchPengaturan(): Promise<KelompokConfig[]> {
  const response = await fetch("/api/pengaturan", {
    headers: { Accept: "application/json" },
  });
  const data = (await parseResponse<KelompokConfig[] | undefined>(response)) ?? [];

  return data;
}

export async function updatePengaturan(modul: string, config: string, nilai: string): Promise<ConfigRow> {
  const response = await fetch("/api/pengaturan", {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ modul, config, nilai }),
  });

  return parseResponse<ConfigRow>(response);
}

export async function fetchTema(): Promise<Tema> {
  const response = await fetch("/api/pengaturan/tema", {
    headers: { Accept: "application/json" },
  });
  const data = await parseResponse<{ tema: Tema }>(response);

  return data.tema;
}
