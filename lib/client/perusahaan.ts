import { parseResponse } from "@/lib/client/apiResponse";
import type { PerusahaanRow } from "@/lib/server/perusahaan/types";

export type DaftarPerusahaanRequest = {
  namaperusahaan: string;
  generateKode  : boolean;
  kodeperusahaan: string;
};

export async function daftarPerusahaan(input: DaftarPerusahaanRequest): Promise<PerusahaanRow> {
  const response = await fetch("/api/perusahaan", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<PerusahaanRow>(response);
}
