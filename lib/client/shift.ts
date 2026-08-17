import type {
  CloseShiftInput,
  OpenShiftInput,
  RecordShiftTransactionInput,
  Shift,
} from "@/lib/server/shift/types";

type ApiResponse<T> = {
  data   ?: T;
  message : string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const json: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(json.message);
  }

  return json.data as T;
}

export async function fetchActiveShift(): Promise<Shift | null> {
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
