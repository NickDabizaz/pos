import { parseResponse } from "@/lib/client/apiResponse";
import type {
  CloseShiftInput,
  OpenShiftInput,
  RecordShiftTransactionInput,
  Shift,
} from "@/lib/server/shift/types";

/** The shift relevant to today: open, closed-but-reopenable, or null if none was opened today. */
export async function fetchCurrentShift(): Promise<Shift | null> {
  const response = await fetch("/api/pos/shift", {
    headers: { Accept: "application/json" },
  });

  return parseResponse<Shift | null>(response);
}

export async function openShift(input: OpenShiftInput): Promise<Shift> {
  const response = await fetch("/api/pos/shift", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Shift>(response);
}

export async function cancelCloseShift(): Promise<Shift> {
  const response = await fetch("/api/pos/shift/cancel-close", {
    method: "POST",
  });

  return parseResponse<Shift>(response);
}

export async function recordShiftTransaction(input: RecordShiftTransactionInput): Promise<Shift> {
  const response = await fetch("/api/pos/shift/transaction", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Shift>(response);
}

export async function closeShift(input: CloseShiftInput): Promise<Shift> {
  const response = await fetch("/api/pos/shift/close", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(input),
  });

  return parseResponse<Shift>(response);
}
