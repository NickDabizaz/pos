import { parseResponse } from "@/lib/client/apiResponse";
import type { SaldoStokBarang } from "@/lib/server/kartustok/service";
import type {
  CreateOpnameStokInput,
  OpnameStok,
  UpdateOpnameStokInput,
} from "@/lib/server/opnamestok/types";

export type { OpnameStok, SaldoStokBarang };

export async function fetchOpnameStokList(): Promise<OpnameStok[]> {
  const response = await fetch("/api/transaksi/opname-stok", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<OpnameStok[] | undefined>(response)) ?? [];
}

export async function fetchOpnameStokByKode(kodeopname: string): Promise<OpnameStok> {
  const response = await fetch(`/api/transaksi/opname-stok/${kodeopname}`, {
    headers: { Accept: "application/json" },
  });

  return parseResponse<OpnameStok>(response);
}

export async function createOpnameStok(input: CreateOpnameStokInput): Promise<OpnameStok> {
  const response = await fetch("/api/transaksi/opname-stok", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<OpnameStok>(response);
}

export async function updateOpnameStok(kodeopname: string, input: UpdateOpnameStokInput): Promise<OpnameStok> {
  const response = await fetch(`/api/transaksi/opname-stok/${kodeopname}`, {
    method : "PATCH",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<OpnameStok>(response);
}

export async function cancelOpnameStok(kodeopname: string, alasanbatal?: string): Promise<OpnameStok> {
  const response = await fetch(`/api/transaksi/opname-stok/${kodeopname}`, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ alasanbatal }),
  });

  return parseResponse<OpnameStok>(response);
}

export async function fetchSaldoStok(kodelokasi: string, tanggal?: string): Promise<SaldoStokBarang[]> {
  const params = new URLSearchParams({ kodelokasi });
  if (tanggal) {
    params.set("tanggal", tanggal);
  }

  const response = await fetch(`/api/stok/saldo?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<SaldoStokBarang[] | undefined>(response)) ?? [];
}
