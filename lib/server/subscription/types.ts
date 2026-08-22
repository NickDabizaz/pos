import type { PrismaClient } from "@/lib/generated/prisma-global/client";

export type GlobalClient = PrismaClient;

export type PaketLangganan = {
  kodepaket      : string;
  namapaket      : string;
  hargapaket     : number;
  masaberlakuhari: number;
};

export type LanggananRow = {
  idsubscription : number;
  idperusahaan   : number;
  orderid        : string;
  namapaket      : string;
  hargapaket     : number;
  masaberlakuhari: number;
  tglmulai       : Date;
  tglselesai     : Date;
  status         : number;
};

export type SnapTransactionResult = {
  orderid    : string;
  token      : string;
  redirecturl: string;
};

export type MidtransNotificationPayload = {
  order_id          : string;
  status_code       : string;
  gross_amount      : string;
  signature_key     : string;
  transaction_status: string;
};

export type MidtransClient = {
  createTransaction(params: {
    transaction_details: { order_id: string; gross_amount: number };
  }): Promise<{ token: string; redirect_url: string }>;
  getStatus(orderId: string): Promise<MidtransNotificationPayload>;
};
