import { createHash, randomBytes } from "node:crypto";

import {
  findSubscriptionByOrderid,
  findPerusahaanById,
  insertSubscriptionDanAktifkanPerusahaan,
  isKonflikOrderid,
} from "@/lib/server/subscription/repository";
import type {
  GlobalClient,
  SubscriptionRow,
  MidtransClient,
  MidtransNotificationPayload,
  PaketSubscription,
  SnapTransactionResult,
} from "@/lib/server/subscription/types";

export const PAKET_SUBSCRIPTION: PaketSubscription[] = [
  { kodepaket: "bulanan", namapaket: "Paket Bulanan", hargapaket: 150_000, masaberlakuhari: 30 },
  { kodepaket: "tahunan", namapaket: "Paket Tahunan", hargapaket: 1_500_000, masaberlakuhari: 365 },
];

const ORDER_ID_PATTERN = /^LGN-(\d+)-([a-z]+)-([a-f0-9]+)$/;

const STATUS_LUNAS     = new Set(["settlement", "capture"]);
const STATUS_PENDING = new Set(["pending"]);

function findPaketByKode(kodepaket: string): PaketSubscription | undefined {
  const paket = PAKET_SUBSCRIPTION.find((item) => item.kodepaket === kodepaket);

  return paket;
}

function generateOrderId(idperusahaan: number, kodepaket: string): string {
  const orderid = `LGN-${idperusahaan}-${kodepaket}-${randomBytes(8).toString("hex")}`;

  return orderid;
}

function parseOrderId(orderid: string): { idperusahaan: number; kodepaket: string } | null {
  const match = ORDER_ID_PATTERN.exec(orderid);
  if (!match) {
    return null;
  }

  const parsed = { idperusahaan: Number(match[1]), kodepaket: match[2] };

  return parsed;
}

function generateSignature(orderid: string, statusCode: string, grossAmount: string, serverKey: string): string {
  const signature = createHash("sha512").update(`${orderid}${statusCode}${grossAmount}${serverKey}`).digest("hex");

  return signature;
}

function tglSelesaiDari(tglmulai: Date, masaberlakuhari: number): Date {
  const hasil = new Date(tglmulai);
  hasil.setUTCDate(hasil.getUTCDate() + masaberlakuhari);

  return hasil;
}

export async function createSnapTransaction(
  db          : GlobalClient,
  idperusahaan: number,
  kodepaket   : string,
  midtransClient: MidtransClient,
): Promise<SnapTransactionResult> {
  const perusahaan = await findPerusahaanById(db, idperusahaan);
  if (!perusahaan) {
    throw new Error(`Perusahaan dengan id ${idperusahaan} tidak ditemukan`);
  }
  if (perusahaan.status !== 0) {
    throw new Error("Perusahaan ini sudah aktif, tidak perlu membayar lagi");
  }

  const paket = findPaketByKode(kodepaket);
  if (!paket) {
    throw new Error(`Paket Subscription "${kodepaket}" tidak ditemukan`);
  }

  const orderid = generateOrderId(idperusahaan, kodepaket);
  const transaksi = await midtransClient.createTransaction({
    transaction_details: { order_id: orderid, gross_amount: paket.hargapaket },
  });

  const hasil = { orderid, token: transaksi.token, redirecturl: transaksi.redirect_url };

  return hasil;
}

export async function handleMidtransNotification(
  db     : GlobalClient,
  payload: MidtransNotificationPayload,
): Promise<{ activated: boolean; subscription: SubscriptionRow | null }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const signatureSah = generateSignature(payload.order_id, payload.status_code, payload.gross_amount, serverKey);
  if (signatureSah.toLowerCase() !== payload.signature_key.toLowerCase()) {
    throw new Error("Signature notifikasi Midtrans tidak valid");
  }

  const diuraikan = parseOrderId(payload.order_id);
  if (!diuraikan) {
    throw new Error(`order_id "${payload.order_id}" tidak pernah dibuat lewat createSnapTransaction`);
  }

  if (STATUS_PENDING.has(payload.transaction_status)) {
    const hasil = { activated: false, subscription: null };

    return hasil;
  }
  if (!STATUS_LUNAS.has(payload.transaction_status)) {
    const hasil = { activated: false, subscription: null };

    return hasil;
  }

  const existing = await findSubscriptionByOrderid(db, payload.order_id);
  if (existing) {
    const hasil = { activated: false, subscription: existing };

    return hasil;
  }

  const perusahaan = await findPerusahaanById(db, diuraikan.idperusahaan);
  if (!perusahaan) {
    throw new Error(`Perusahaan dengan id ${diuraikan.idperusahaan} tidak ditemukan`);
  }

  const paket = findPaketByKode(diuraikan.kodepaket);
  if (!paket) {
    throw new Error(`Paket Subscription "${diuraikan.kodepaket}" tidak ditemukan`);
  }

  if (Number(payload.gross_amount) !== paket.hargapaket) {
    throw new Error("gross_amount pada notifikasi tidak sesuai harga Paket Subscription");
  }

  const tglmulai = new Date(new Date().toISOString().slice(0, 10));
  const tglselesai = tglSelesaiDari(tglmulai, paket.masaberlakuhari);

  try {
    const subscription = await insertSubscriptionDanAktifkanPerusahaan(
      db,
      diuraikan.idperusahaan,
      payload.order_id,
      paket,
      tglmulai,
      tglselesai,
    );
    const hasil = { activated: true, subscription };

    return hasil;
  } catch (error) {
    if (isKonflikOrderid(error)) {
      const subscription = await findSubscriptionByOrderid(db, payload.order_id);
      const hasil = { activated: false, subscription };

      return hasil;
    }
    throw error;
  }
}

export async function syncSnapTransaction(
  db            : GlobalClient,
  orderid       : string,
  midtransClient: MidtransClient,
): Promise<{ activated: boolean; subscription: SubscriptionRow | null }> {
  const payload = await midtransClient.getStatus(orderid);
  const hasil = await handleMidtransNotification(db, payload);

  return hasil;
}
