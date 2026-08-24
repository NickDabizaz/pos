import { parseResponse } from "@/lib/client/apiResponse";
import type { CloseShiftInput, Shift } from "@/lib/server/shift/types";

export async function fetchShiftStatus(kodelokasi: string): Promise<Shift> {
  const response = await fetch(`/api/pos/shift?kodelokasi=${encodeURIComponent(kodelokasi)}`, {
    headers: { Accept: "application/json" },
  });

  return parseResponse<Shift>(response);
}

export async function openShift(input: { kodelokasi: string; modalawal: number }): Promise<Shift> {
  const response = await fetch("/api/pos/shift", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Shift>(response);
}

export async function cancelCloseShift(kodelokasi: string): Promise<Shift> {
  const response = await fetch("/api/pos/shift/cancel-close", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ kodelokasi }),
  });

  return parseResponse<Shift>(response);
}

export async function closeShift(input: Omit<CloseShiftInput, "tanggal">): Promise<Shift> {
  const response = await fetch("/api/pos/shift/close", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Shift>(response);
}
