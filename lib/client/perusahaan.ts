import { parseResponse } from "@/lib/client/apiResponse";
import type { PerusahaanRow } from "@/lib/server/perusahaan/types";
import type { PerusahaanMembership } from "@/lib/server/user/types";

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

export async function listPerusahaanMilikSaya(): Promise<PerusahaanMembership[]> {
  const response = await fetch("/api/perusahaan/aktif");

  return parseResponse<PerusahaanMembership[]>(response);
}

export async function pilihPerusahaanAktif(idperusahaan: number): Promise<void> {
  const response = await fetch("/api/perusahaan/aktif", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ idperusahaan }),
  });

  await parseResponse<void>(response);
}
