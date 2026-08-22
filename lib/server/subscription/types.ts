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

/** Bentuk payload notifikasi Midtrans yang dipakai — field lain diabaikan. */
export type MidtransNotificationPayload = {
  order_id          : string;
  status_code       : string;
  gross_amount      : string;
  signature_key     : string;
  transaction_status: string;
};

/** Seam ke SDK Midtrans — hanya method yang dipakai; lihat pola `buatDatabase` di tiket 07. */
export type MidtransClient = {
  createTransaction(params: {
    transaction_details: { order_id: string; gross_amount: number };
  }): Promise<{ token: string; redirect_url: string }>;
  /**
   * Cek status transaksi langsung ke Midtrans (server-to-server, diautentikasi lewat Server
   * Key) — dipakai `syncSnapTransaction` sebagai jalan pintas saat notifikasi webhook belum
   * bisa sampai (mis. dev lokal tanpa tunnel publik). Respons Midtrans memuat `signature_key`
   * yang sama seperti payload notifikasi, jadi bisa langsung dioper ke
   * `handleMidtransNotification` tanpa jalur verifikasi terpisah.
   */
  getStatus(orderId: string): Promise<MidtransNotificationPayload>;
};
