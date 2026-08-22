import { parseResponse } from "@/lib/client/apiResponse";
import type { PaketSubscription, SnapTransactionResult } from "@/lib/server/subscription/types";

export async function listPaketSubscription(): Promise<PaketSubscription[]> {
  const response = await fetch("/api/subscription");
  return parseResponse<PaketSubscription[]>(response);
}

export async function checkoutSubscription(idperusahaan: number, kodepaket: string): Promise<SnapTransactionResult> {
  const response = await fetch("/api/subscription/checkout", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ idperusahaan, kodepaket }),
  });

  return parseResponse<SnapTransactionResult>(response);
}

export async function syncSubscription(orderid: string): Promise<{ activated: boolean }> {
  const response = await fetch("/api/subscription/sync", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ orderid }),
  });

  return parseResponse<{ activated: boolean }>(response);
}
