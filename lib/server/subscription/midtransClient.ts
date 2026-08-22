import midtransClient from "midtrans-client";

import type { MidtransClient } from "@/lib/server/subscription/types";

/** Snap client Midtrans produksi — kredensial dibaca dari environment, tidak pernah tertulis di kode. */
export function createMidtransClient(): MidtransClient {
  const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey   : process.env.MIDTRANS_SERVER_KEY,
    clientKey   : process.env.MIDTRANS_CLIENT_KEY,
  });

  return {
    createTransaction: (params) => snap.createTransaction(params),
    getStatus        : (orderId) => snap.transaction.status(orderId),
  };
}
